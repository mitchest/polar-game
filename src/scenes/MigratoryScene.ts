import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, MIGRATORY, migratoryTuning, type Difficulty } from '../config';
import InputController from '../input/InputController';
import { touchControls, isTouchDevice } from '../input/TouchControls';
import Button from '../ui/Button';

// A boil of bubbles on the surface that telegraphs (and then launches) an orca.
interface Boil {
  c: Phaser.GameObjects.Container;
  warned: boolean;
  triggered: boolean;
  breach: number; // this orca's upward launch speed
  orca?: Phaser.GameObjects.Image; // the orca rising from the boil (pre-launch)
}
interface Orca {
  c: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
}
// A seabird hovering in the upper air — it just drifts past with the world.
interface Bird {
  c: Phaser.GameObjects.Image;
}
// A parallax background layer (clouds / distant ice) that scrolls and wraps.
interface Drifter {
  obj: Phaser.GameObjects.GameObject & { x: number };
  factor: number; // fraction of the scroll speed
}

/**
 * Migratory — "The Great Flight" side-on flyer (Issue #5).
 *
 * You're an Arctic tern flying over the open ocean from the South Pole to the
 * North Pole — the longest migration of any animal. The tern holds a fixed spot
 * on screen while the sea scrolls past beneath it.
 *   ↑ fly higher · ↓ fly lower · → faster · ← slower
 * Hazards alternate: orcas breach straight up from the water (climb above them),
 * and seabirds hover up high (dip back down under them). Reach the pole to win.
 */
export default class MigratoryScene extends Phaser.Scene {
  private controls!: InputController;
  private tern!: Phaser.GameObjects.Image;
  private vy = 0;
  private flightSpeed: number = MIGRATORY.cruiseSpeed;

  private boils: Boil[] = [];
  private orcas: Orca[] = [];
  private birds: Bird[] = [];
  private waves: Phaser.GameObjects.Arc[] = [];
  private drifters: Drifter[] = [];

  private distance = 0; // px of ocean travelled toward the pole
  private progress = 0; // distance / runDistance, 0..1
  private nextSpawnDistance = 0; // spawn the next hazard once distance passes this
  private nextHazard: 'orca' | 'bird' = 'orca'; // hazards alternate so neither extreme is safe
  private scrollSpeed: number = MIGRATORY.cruiseSpeed;
  private ended = false;
  private difficulty: Difficulty = 'hard';
  private tuned = migratoryTuning('hard'); // difficulty-adjusted, set in create

  private progressBar!: Phaser.GameObjects.Graphics;
  private speedBar!: Phaser.GameObjects.Graphics;
  private bannerShown = false;

  constructor() {
    super('Migratory');
  }

  init(data?: { difficulty?: Difficulty }): void {
    // Default to 'hard' (the base tuning) so ?scene=Migratory behaves predictably.
    this.difficulty = data?.difficulty ?? 'hard';
  }

  create(): void {
    this.tuned = migratoryTuning(this.difficulty);
    this.vy = 0;
    this.flightSpeed = this.tuned.cruiseSpeed;
    this.boils = [];
    this.orcas = [];
    this.birds = [];
    this.waves = [];
    this.drifters = [];
    this.distance = 0;
    this.progress = 0;
    this.nextSpawnDistance = 480; // first hazard after a short warm-up
    this.nextHazard = 'orca';
    this.scrollSpeed = this.tuned.cruiseSpeed;
    this.ended = false;
    this.bannerShown = false;

    this.cameras.main.setBackgroundColor('#bfe6f5');
    this.cameras.main.fadeIn(250, 14, 34, 51);

    this.drawSkyAndSea();

    this.tern = this.makeTern(MIGRATORY.ternX, MIGRATORY.ternStartY).setDepth(10);

    this.progressBar = this.add.graphics().setDepth(20);
    this.add
      .text(GAME_WIDTH / 2, 28, 'Fly to the North Pole!   ↑↓ height · → faster · ← slower', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: COLORS.textDark,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Speed gauge (top-right): how fast you're flying, slow → fast.
    this.add
      .text(GAME_WIDTH - 182, 30, 'SPEED', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: COLORS.textDark,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setDepth(20);
    this.speedBar = this.add.graphics().setDepth(20);

    const back = new Button(this, 86, GAME_HEIGHT - 44, '❮ Menu', () => this.toMenu(), {
      width: 130,
      height: 52,
      fontSize: 22,
    });
    back.setDepth(20);
    this.input.keyboard!.on('keydown-ESC', () => this.toMenu());

    this.controls = new InputController(this);

    if (isTouchDevice()) touchControls.enable(this, () => this.toMenu());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => touchControls.disable());
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    const mv = this.controls.movement;

    // Forward speed eases toward a target set by ←/→ (→ faster, ← slower).
    const sx = mv.x; // +1 = right = faster, -1 = left = slower
    let target = this.tuned.cruiseSpeed;
    if (sx > 0.01) target = Phaser.Math.Linear(this.tuned.cruiseSpeed, this.tuned.maxSpeed, Math.min(sx, 1));
    else if (sx < -0.01) target = Phaser.Math.Linear(this.tuned.cruiseSpeed, MIGRATORY.minSpeed, Math.min(-sx, 1));
    this.flightSpeed = Phaser.Math.Linear(this.flightSpeed, target, Math.min(1, MIGRATORY.speedEase * dt));
    this.scrollSpeed = this.flightSpeed;

    // Distance-based progress, so flying faster genuinely shortens the run.
    this.distance += this.scrollSpeed * dt;
    this.progress = Phaser.Math.Clamp(this.distance / this.tuned.runDistance, 0, 1);

    this.updateTern(dt, mv);
    this.updateWaves(dt);
    this.updateDrifters(dt);
    this.updateSpawning(this.progress);
    this.updateBoils(dt);
    this.updateOrcas(dt);
    this.updateBirds(dt);
    this.drawProgress(this.progress);
    this.drawSpeedMeter();

    if (this.progress >= 1) this.win();
  }

  // --- tern ----------------------------------------------------------------

  private updateTern(dt: number, mv: Phaser.Math.Vector2): void {
    // Gentle gravity always pulls down; flapping (↑) climbs, diving (↓) descends.
    this.vy += MIGRATORY.gravity * dt;
    if (mv.y < -0.01) this.vy += mv.y * MIGRATORY.flapAccel * dt; // ↑ (mv.y negative)
    else if (mv.y > 0.01) this.vy += mv.y * MIGRATORY.diveAccel * dt; // ↓
    this.vy -= this.vy * MIGRATORY.vDrag * dt; // air resistance
    this.vy = Phaser.Math.Clamp(this.vy, -MIGRATORY.maxVSpeed, MIGRATORY.maxVSpeed);

    let y = this.tern.y + this.vy * dt;
    if (y < MIGRATORY.ternMinY) {
      y = MIGRATORY.ternMinY;
      this.vy = 0;
    } else if (y > MIGRATORY.ternMaxY) {
      y = MIGRATORY.ternMaxY;
      this.vy = 0;
    }
    this.tern.setY(y);
    // Tilt: nose up while climbing, nose down while diving.
    this.tern.setRotation(Phaser.Math.Clamp(this.vy / MIGRATORY.maxVSpeed, -1, 1) * 0.42);
  }

  // --- background ----------------------------------------------------------

  private drawSkyAndSea(): void {
    const water = MIGRATORY.waterLineY;
    const g = this.add.graphics().setDepth(0);

    // Soft polar sky with a low sun glow.
    g.fillStyle(0xd7f0fa, 1).fillRect(0, 0, GAME_WIDTH, water);
    g.fillStyle(0xfff6da, 0.5).fillCircle(150, 120, 70);
    g.fillStyle(0xfff6da, 0.22).fillCircle(150, 120, 110);

    // Distant ice shelf along the horizon.
    g.fillStyle(0xeaf6fb, 0.95);
    g.beginPath();
    g.moveTo(0, water);
    g.lineTo(0, water - 18);
    for (let x = 0; x <= GAME_WIDTH; x += 80) {
      g.lineTo(x, water - 14 - ((x / 80) % 2) * 12);
    }
    g.lineTo(GAME_WIDTH, water);
    g.closePath();
    g.fillPath();

    // Ocean.
    g.fillStyle(0x2f7bb0, 1).fillRect(0, water, GAME_WIDTH, GAME_HEIGHT - water);
    g.fillStyle(0x256491, 0.5).fillRect(0, water + 90, GAME_WIDTH, GAME_HEIGHT - water - 90);
    g.fillStyle(0x8fd0ec, 0.5).fillRect(0, water, GAME_WIDTH, 4); // bright surface line

    // Parallax clouds (slow) and a couple of distant icebergs (medium).
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 330 + Phaser.Math.Between(-40, 40);
      const y = 70 + Phaser.Math.Between(-20, 40);
      const cloud = this.add.graphics().setDepth(1);
      cloud.fillStyle(0xffffff, 0.7);
      cloud.fillEllipse(0, 0, 150, 44);
      cloud.fillEllipse(-46, 8, 90, 34);
      cloud.fillEllipse(50, 6, 100, 36);
      cloud.setPosition(x, y);
      this.drifters.push({ obj: cloud, factor: 0.18 });
    }
    for (let i = 0; i < 3; i++) {
      const x = 260 + i * 460 + Phaser.Math.Between(-60, 60);
      const berg = this.add.graphics().setDepth(2);
      berg.fillStyle(0xeef8fc, 0.95);
      berg.fillTriangle(-46, 6, 0, -28, 30, 6);
      berg.fillTriangle(0, 6, 40, -16, 64, 6);
      berg.fillStyle(0xbfe0ef, 0.9);
      berg.fillRect(-46, 4, 110, 10);
      berg.setPosition(x, MIGRATORY.waterLineY - 6);
      this.drifters.push({ obj: berg, factor: 0.45 });
    }

    // Whitecap dashes near the surface that scroll for a sense of speed.
    for (let i = 0; i < 40; i++) {
      const wave = this.add
        .circle(
          Phaser.Math.Between(0, GAME_WIDTH),
          Phaser.Math.Between(water + 12, GAME_HEIGHT - 8),
          Phaser.Math.Between(2, 4),
          0xffffff,
          0.55,
        )
        .setDepth(3);
      this.waves.push(wave);
    }
  }

  private updateWaves(dt: number): void {
    const dx = this.scrollSpeed * dt;
    this.waves.forEach((w) => {
      w.x -= dx;
      if (w.x < -6) {
        w.x += GAME_WIDTH + 12;
        w.y = Phaser.Math.Between(MIGRATORY.waterLineY + 12, GAME_HEIGHT - 8);
      }
    });
  }

  private updateDrifters(dt: number): void {
    this.drifters.forEach((d) => {
      d.obj.x -= this.scrollSpeed * d.factor * dt;
      if (d.obj.x < -180) d.obj.x += GAME_WIDTH + 360;
    });
  }

  // --- hazards -------------------------------------------------------------

  private updateSpawning(progress: number): void {
    if (progress > 0.9) return; // clean finish — stop spawning near the pole
    if (this.distance < this.nextSpawnDistance) return;
    // Alternate orca / seabird so neither the water nor the ceiling is ever a safe
    // place to camp. Spacing is by distance (see config) so the two never share
    // the tern's column.
    if (this.nextHazard === 'orca') {
      this.spawnBoil();
      this.nextHazard = 'bird';
    } else {
      this.spawnBird();
      this.nextHazard = 'orca';
    }
    this.nextSpawnDistance = this.distance + this.tuned.spawnGapPx;
  }

  private spawnBoil(): void {
    const breach = this.tuned.orcaBreachSpeed + Phaser.Math.Between(-MIGRATORY.orcaBreachVar, MIGRATORY.orcaBreachVar);

    const ring = this.add.ellipse(0, 0, 70, 18, 0xffffff, 0.0).setStrokeStyle(2, 0xffffff, 0.5);
    const bubbles = this.add.graphics();
    bubbles.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 6; i++) {
      bubbles.fillCircle(Phaser.Math.Between(-26, 26), Phaser.Math.Between(-4, 5), Phaser.Math.Between(2, 4));
    }
    bubbles.fillStyle(0x1d5f86, 0.18);
    bubbles.fillEllipse(0, 6, 74, 20);
    const c = this.add.container(GAME_WIDTH + 60, MIGRATORY.waterLineY, [ring, bubbles]).setDepth(5);
    this.boils.push({ c, warned: false, triggered: false, breach });
  }

  // A seabird drifts in from the right and hovers in the upper air (no chasing).
  private spawnBird(): void {
    const petrel = Math.random() < MIGRATORY.petrelChance;
    const y = Phaser.Math.Between(MIGRATORY.birdBandTopY, MIGRATORY.birdBandBottomY);
    const bird = this.makeBird(GAME_WIDTH + 90, y, petrel);
    this.birds.push({ c: bird });
  }

  private updateBirds(dt: number): void {
    const dx = this.scrollSpeed * dt;
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      b.c.x -= dx;
      if (
        Phaser.Math.Distance.Between(b.c.x, b.c.y, this.tern.x, this.tern.y) <
        MIGRATORY.birdHitDistance
      ) {
        this.lose('You flew into a seabird!');
        return;
      }
      if (b.c.x < -160) {
        b.c.destroy();
        this.birds.splice(i, 1);
      }
    }
  }

  private updateBoils(dt: number): void {
    const dx = this.scrollSpeed * dt;
    for (let i = this.boils.length - 1; i >= 0; i--) {
      const b = this.boils[i];
      b.c.x -= dx;
      if (b.orca && !b.triggered) b.orca.x = b.c.x; // emerging orca rides its boil

      if (!b.warned && b.c.x <= MIGRATORY.ternX + MIGRATORY.warnAheadX) {
        b.warned = true;
        this.spawnEmergingOrca(b);
      }
      if (b.orca && !b.triggered) this.updateEmergingOrca(b);

      // When the boil reaches the tern's column, the orca erupts straight up out
      // of it (it rises through every height in the column), so the only way past
      // is to climb above its peak.
      if (!b.triggered && b.c.x <= MIGRATORY.ternX) {
        this.launchOrca(b);
      }

      if (b.c.x < -90) {
        b.c.destroy();
        this.boils.splice(i, 1);
      }
    }
  }

  // An orca starts surfacing at the boil, small and pointed up.
  private spawnEmergingOrca(b: Boil): void {
    b.orca = this.makeOrca(b.c.x, MIGRATORY.waterLineY - 4)
      .setDepth(6)
      .setScale(0.22)
      .setAlpha(0.55)
      .setRotation(-Math.PI / 2);
  }

  // Grow the surfacing orca as its boil closes on the tern's column.
  private updateEmergingOrca(b: Boil): void {
    const orca = b.orca!;
    const t = Phaser.Math.Clamp(1 - (b.c.x - MIGRATORY.ternX) / MIGRATORY.warnAheadX, 0, 1);
    orca.setScale(0.22 + 0.78 * t).setAlpha(0.55 + 0.45 * t);
    orca.setY(MIGRATORY.waterLineY - 4 - 18 * t);
  }

  // Commit the orca to its breach arc, aimed to peak in the tern's column.
  private launchOrca(b: Boil): void {
    b.triggered = true;
    const orca = b.orca ?? this.makeOrca(MIGRATORY.ternX, MIGRATORY.waterLineY - 4);
    b.orca = undefined;
    // Erupt straight up out of the tern's column (no horizontal drift).
    orca.setPosition(MIGRATORY.ternX, MIGRATORY.waterLineY - 4).setDepth(8).setScale(0.5).setAlpha(1);
    this.orcas.push({ c: orca, vx: 0, vy: -b.breach });
    this.splash(MIGRATORY.ternX, MIGRATORY.waterLineY);

    // The boil settles once the orca is out.
    this.tweens.add({ targets: b.c, alpha: 0, duration: 450 });
  }

  private updateOrcas(dt: number): void {
    for (let i = this.orcas.length - 1; i >= 0; i--) {
      const o = this.orcas[i];
      o.vy += MIGRATORY.orcaGravity * dt;
      o.c.x += o.vx * dt;
      o.c.y += o.vy * dt;
      o.c.setRotation(Math.atan2(o.vy, o.vx)); // nose-first along the arc

      if (
        Phaser.Math.Distance.Between(o.c.x, o.c.y, this.tern.x, this.tern.y) < MIGRATORY.hitDistance
      ) {
        this.lose('An orca caught you!');
        return;
      }

      // Splash back into the sea, or drift off-screen.
      if ((o.c.y > MIGRATORY.waterLineY + 6 && o.vy > 0) || o.c.x < -120) {
        if (o.c.x > -120) this.splash(o.c.x, MIGRATORY.waterLineY);
        o.c.destroy();
        this.orcas.splice(i, 1);
      }
    }
  }

  // A quick burst of white droplets where an orca breaks the surface.
  private splash(x: number, y: number): void {
    this.add
      .particles(x, y, 'pixel', {
        speed: { min: 60, max: 220 },
        angle: { min: 200, max: 340 },
        gravityY: 700,
        lifespan: 600,
        scale: { start: 2.4, end: 0 },
        quantity: 14,
        tint: 0xffffff,
        emitting: false,
      })
      .setDepth(9)
      .explode(14);
  }

  // --- hud -----------------------------------------------------------------

  private drawProgress(progress: number): void {
    const w = 620;
    const x = (GAME_WIDTH - w) / 2;
    const y = 58;
    this.progressBar.clear();
    this.progressBar.fillStyle(0x0e2233, 0.18).fillRoundedRect(x - 3, y - 3, w + 6, 18, 9);
    this.progressBar.fillStyle(0x2bd06a, 1).fillRoundedRect(x, y, w * progress, 12, 6);
    // A little tern marker riding the bar, S(outh) → N(orth).
    this.progressBar.fillStyle(0xffffff, 0.9).fillCircle(x + w * progress, y + 6, 6);

    if (!this.bannerShown && progress > 0.9) {
      this.bannerShown = true;
      const banner = this.add
        .text(GAME_WIDTH / 2, 150, 'North Pole ahead!', {
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

  private drawSpeedMeter(): void {
    const w = 140;
    const h = 14;
    const x = GAME_WIDTH - w - 30;
    const y = 23;
    const frac = Phaser.Math.Clamp(
      (this.flightSpeed - MIGRATORY.minSpeed) / (this.tuned.maxSpeed - MIGRATORY.minSpeed),
      0,
      1,
    );
    this.speedBar.clear();
    this.speedBar.fillStyle(0x0e2233, 0.18).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 7);
    // Calm blue when cruising, warmer as you push faster.
    const col = frac > 0.66 ? 0xff7a3a : frac > 0.33 ? 0xffc24a : 0x4aa3df;
    this.speedBar.fillStyle(col, 1).fillRoundedRect(x, y, Math.max(0, w * frac), h, 6);
  }

  // --- sprite factories ----------------------------------------------------

  // Arctic tern in flight, facing right (the direction of travel = north). The
  // scene tilts and gently flaps it.
  private makeTern(x: number, y: number): Phaser.GameObjects.Image {
    const tern = this.add.image(x, y, 'tern').setScale(0.5);
    this.tweens.add({
      targets: tern,
      scaleY: 0.42,
      duration: 170,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    return tern;
  }

  // Orca built pointing right; the scene rotates it to follow its breach arc.
  private makeOrca(x: number, y: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, 'orca').setScale(0.5);
  }

  // A gliding seabird facing right (the tern's direction). Albatrosses are big
  // and pale; petrels are a bit smaller and darker (a grey tint on the same art).
  // A slow scale-pulse reads as a lazy wingbeat.
  private makeBird(x: number, y: number, petrel: boolean): Phaser.GameObjects.Image {
    const base = petrel ? 0.4 : 0.52;
    const bird = this.add.image(x, y, 'seabird').setScale(base).setDepth(9);
    if (petrel) bird.setTint(0x7c8189);
    this.tweens.add({
      targets: bird,
      scaleY: base * 0.9,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    return bird;
  }

  // --- end states ----------------------------------------------------------

  private win(): void {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.fadeOut(350, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Facts', { region: 'migratory' });
    });
  }

  private lose(reason: string): void {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.shake(250, 0.012);
    this.cameras.main.fadeOut(400, 40, 10, 10);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameOver', {
        stage: 'Migratory',
        reason,
        difficulty: this.difficulty,
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
