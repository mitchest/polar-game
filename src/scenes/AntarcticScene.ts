import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ANTARCTIC } from '../config';
import InputController from '../input/InputController';
import { touchControls, isTouchDevice } from '../input/TouchControls';
import Button from '../ui/Button';

interface Hole {
  c: Phaser.GameObjects.Container;
  warned: boolean;
  triggered: boolean;
}
interface Seal {
  c: Phaser.GameObjects.Container;
  vx: number;
  vy: number;
}

/**
 * Antarctic — "Slippery Slide" toboggan run.
 *
 * The gentoo penguin slides forward (the ice scrolls past). Steer left/right —
 * with slidey ice momentum — to avoid leopard seals that burst out of holes and
 * lunge at you. Survive to the colony to win.
 */
export default class AntarcticScene extends Phaser.Scene {
  private controls!: InputController;
  private penguin!: Phaser.GameObjects.Image;
  private vx = 0;
  private vy = 0;

  private holes: Hole[] = [];
  private seals: Seal[] = [];
  private specks: Phaser.GameObjects.Arc[] = [];

  private elapsed = 0;
  private spawnTimer = 0;
  private scrollSpeed: number = ANTARCTIC.scrollSpeedStart;
  private ended = false;

  private progressBar!: Phaser.GameObjects.Graphics;
  private bannerShown = false;

  constructor() {
    super('Antarctic');
  }

  create(): void {
    this.vx = 0;
    this.vy = 0;
    this.holes = [];
    this.seals = [];
    this.specks = [];
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.scrollSpeed = ANTARCTIC.scrollSpeedStart;
    this.ended = false;
    this.bannerShown = false;

    this.cameras.main.setBackgroundColor('#d2effb');
    this.cameras.main.fadeIn(250, 14, 34, 51);

    // Thin-ice / water borders mark the playable width.
    this.add.rectangle(0, 0, ANTARCTIC.edgeMargin, GAME_HEIGHT, COLORS.antarcticWater, 0.25).setOrigin(0, 0);
    this.add
      .rectangle(GAME_WIDTH, 0, ANTARCTIC.edgeMargin, GAME_HEIGHT, COLORS.antarcticWater, 0.25)
      .setOrigin(1, 0);

    // Scrolling snow specks for a sense of speed.
    for (let i = 0; i < 46; i++) {
      const speck = this.add
        .circle(
          Phaser.Math.Between(0, GAME_WIDTH),
          Phaser.Math.Between(0, GAME_HEIGHT),
          Phaser.Math.Between(2, 4),
          0xffffff,
          0.7,
        )
        .setDepth(1);
      this.specks.push(speck);
    }

    this.penguin = this.makePenguin(
      ANTARCTIC.penguinStartX,
      ANTARCTIC.penguinStartY,
    ).setDepth(10);

    this.progressBar = this.add.graphics().setDepth(20);
    this.add
      .text(GAME_WIDTH / 2, 28, 'Dodge the leopard seals!   ↑↓ speed · ←→ steer', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: COLORS.textDark,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20);

    const back = new Button(this, 86, GAME_HEIGHT - 44, '❮ Menu', () => this.toMenu(), {
      width: 130,
      height: 52,
      fontSize: 22,
    });
    back.setDepth(20);
    this.input.keyboard!.on('keydown-ESC', () => this.toMenu());

    this.controls = new InputController(this);

    // On touch devices, steer from the control band below the game (Menu button included).
    if (isTouchDevice()) touchControls.enable(this, () => this.toMenu());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => touchControls.disable());
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    this.elapsed += delta;

    const progress = Phaser.Math.Clamp(this.elapsed / ANTARCTIC.runDurationMs, 0, 1);
    this.scrollSpeed = Phaser.Math.Linear(
      ANTARCTIC.scrollSpeedStart,
      ANTARCTIC.scrollSpeedEnd,
      progress,
    );

    this.updatePenguin(dt);
    this.updateSpecks(dt);
    this.updateSpawning(delta, progress);
    this.updateHoles(dt);
    this.updateSeals(dt);
    this.drawProgress(progress);

    if (progress >= 1) {
      this.win();
    }
  }

  // --- penguin -------------------------------------------------------------

  private updatePenguin(dt: number): void {
    const mv = this.controls.movement;
    const accel = ANTARCTIC.steerAccel;
    const max = ANTARCTIC.steerMaxSpeed;
    const friction = ANTARCTIC.iceFriction;

    // Horizontal steering (slidey ice momentum).
    if (Math.abs(mv.x) > 0.01) this.vx += mv.x * accel * dt;
    else this.vx -= this.vx * friction * dt; // glide to a stop
    this.vx = Phaser.Math.Clamp(this.vx, -max, max);

    // Vertical: up = slide faster / forward, down = ease back / slower.
    if (Math.abs(mv.y) > 0.01) this.vy += mv.y * accel * dt;
    else this.vy -= this.vy * friction * dt;
    this.vy = Phaser.Math.Clamp(this.vy, -max, max);

    const lo = ANTARCTIC.edgeMargin + 20;
    const hi = GAME_WIDTH - ANTARCTIC.edgeMargin - 20;
    let x = this.penguin.x + this.vx * dt;
    if (x < lo) {
      x = lo;
      this.vx = 0;
    } else if (x > hi) {
      x = hi;
      this.vx = 0;
    }

    let y = this.penguin.y + this.vy * dt;
    if (y < ANTARCTIC.penguinMinY) {
      y = ANTARCTIC.penguinMinY;
      this.vy = 0;
    } else if (y > ANTARCTIC.penguinMaxY) {
      y = ANTARCTIC.penguinMaxY;
      this.vy = 0;
    }

    this.penguin.setPosition(x, y);
    // Lean into the slide a little.
    this.penguin.setRotation(Phaser.Math.Clamp(this.vx / max, -1, 1) * 0.18);
  }

  private updateSpecks(dt: number): void {
    const dy = this.scrollSpeed * dt;
    this.specks.forEach((s) => {
      s.y += dy;
      if (s.y > GAME_HEIGHT) {
        s.y -= GAME_HEIGHT;
        s.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    });
  }

  // --- hazards -------------------------------------------------------------

  private updateSpawning(delta: number, progress: number): void {
    // Stop spawning for the final stretch so the finish is clean.
    if (progress > 0.9) return;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnHole();
      const interval = Phaser.Math.Linear(
        ANTARCTIC.spawnIntervalStartMs,
        ANTARCTIC.spawnIntervalEndMs,
        progress,
      );
      this.spawnTimer = interval;
    }
  }

  private spawnHole(): void {
    const x = Phaser.Math.Between(ANTARCTIC.edgeMargin + 40, GAME_WIDTH - ANTARCTIC.edgeMargin - 40);
    // Craggy ice hole; slight random rotation so no two look identical.
    const hole = this.add
      .image(0, 0, 'ice-hole')
      .setScale(0.5)
      .setRotation(Phaser.Math.FloatBetween(-0.5, 0.5));
    const c = this.add.container(x, -40, [hole]).setDepth(5);
    this.holes.push({ c, warned: false, triggered: false });
  }

  private updateHoles(dt: number): void {
    const dy = this.scrollSpeed * dt;
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const h = this.holes[i];
      h.c.y += dy;

      if (!h.warned && h.c.y >= ANTARCTIC.warnY) {
        h.warned = true;
        this.tweens.add({
          targets: h.c,
          scale: { from: 1, to: 1.18 },
          yoyo: true,
          repeat: -1,
          duration: 220,
        });
      }
      if (!h.triggered && h.c.y >= ANTARCTIC.triggerY) {
        h.triggered = true;
        this.spawnSeal(h.c.x, h.c.y);
      }
      if (h.c.y > GAME_HEIGHT + 60) {
        h.c.destroy();
        this.holes.splice(i, 1);
      }
    }
  }

  private spawnSeal(x: number, y: number): void {
    const angle = Phaser.Math.Angle.Between(x, y, this.penguin.x, this.penguin.y);
    const speed = this.scrollSpeed + ANTARCTIC.sealLungeSpeed;
    const c = this.makeSeal(x, y).setDepth(8);
    c.setRotation(angle);

    // Pop-out flourish, then it's committed along its lunge line.
    c.setScale(0.4);
    this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.out' });
    this.seals.push({ c, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }

  private updateSeals(dt: number): void {
    for (let i = this.seals.length - 1; i >= 0; i--) {
      const s = this.seals[i];
      s.c.x += s.vx * dt;
      s.c.y += s.vy * dt;

      if (
        Phaser.Math.Distance.Between(s.c.x, s.c.y, this.penguin.x, this.penguin.y) <
        ANTARCTIC.hitDistance
      ) {
        this.lose();
        return;
      }

      if (
        s.c.y > GAME_HEIGHT + 80 ||
        s.c.y < -80 ||
        s.c.x < -80 ||
        s.c.x > GAME_WIDTH + 80
      ) {
        s.c.destroy();
        this.seals.splice(i, 1);
      }
    }
  }

  // --- hud -----------------------------------------------------------------

  private drawProgress(progress: number): void {
    const w = 620;
    const x = (GAME_WIDTH - w) / 2;
    const y = 58;
    this.progressBar.clear();
    this.progressBar.fillStyle(0x0e2233, 0.18).fillRoundedRect(x - 3, y - 3, w + 6, 18, 9);
    this.progressBar.fillStyle(0x2bd06a, 1).fillRoundedRect(x, y, w * progress, 12, 6);

    if (!this.bannerShown && progress > 0.9) {
      this.bannerShown = true;
      const banner = this.add
        .text(GAME_WIDTH / 2, 150, 'Colony ahead! 🐧', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '40px',
          color: '#0e2233',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(21)
        .setAlpha(0);
      this.tweens.add({ targets: banner, alpha: 1, y: 130, duration: 400 });
    }
  }

  // --- sprite factories ----------------------------------------------------

  // Gentoo penguin tobogganing on its belly, seen from above (head forward,
  // flippers out, feet trailing). Built facing up (-y); the scene leans it.
  private makePenguin(x: number, y: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, 'penguin').setScale(0.5);
  }

  // Angry leopard seal built pointing right (+x). Wrapped in a container so the
  // scene's pop-out scale tween (0.4 -> 1) works on top of the sprite's 0.5.
  private makeSeal(x: number, y: number): Phaser.GameObjects.Container {
    const seal = this.add.image(0, 0, 'leopard-seal').setScale(0.5);
    return this.add.container(x, y, [seal]);
  }

  // --- end states ----------------------------------------------------------

  private win(): void {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.fadeOut(350, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Facts', { region: 'antarctic' });
    });
  }

  private lose(): void {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.shake(250, 0.012);
    this.cameras.main.fadeOut(400, 40, 10, 10);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameOver', {
        stage: 'Antarctic',
        reason: 'A leopard seal caught you!',
      });
    });
  }

  private toMenu(): void {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.fadeOut(200, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Menu');
    });
  }
}
