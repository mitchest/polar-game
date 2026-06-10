import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ARCTIC } from '../config';
import InputController from '../input/InputController';
import { touchControls, isTouchDevice } from '../input/TouchControls';
import Button from '../ui/Button';

/**
 * Arctic — "Sneaky Fox" stealth.
 *
 * The fox must reach the polar bear's fish and carry it back to the den without
 * being caught in the bear's sweeping vision cone. Snow mounds block the bear's
 * line of sight, so you dash between cover while the cone is looking elsewhere.
 */
export default class ArcticScene extends Phaser.Scene {
  private controls!: InputController;
  private fox!: Phaser.GameObjects.Container;
  private bearHead!: Phaser.GameObjects.Image;
  private cone!: Phaser.GameObjects.Graphics;
  private alert!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private food!: Phaser.GameObjects.Image;
  private carriedFish!: Phaser.GameObjects.Image;
  private detectBar!: Phaser.GameObjects.Graphics;

  private readonly mounds = ARCTIC.mounds.map((m) => new Phaser.Geom.Circle(m.x, m.y, m.r));
  private elapsed = 0;
  private detect = 0; // 0..1 alarm meter
  private hasFood = false;
  private ended = false;

  constructor() {
    super('Arctic');
  }

  create(): void {
    this.elapsed = 0;
    this.detect = 0;
    this.hasFood = false;
    this.ended = false;

    this.cameras.main.setBackgroundColor('#eaf6fb');
    this.cameras.main.fadeIn(250, 14, 34, 51);

    this.drawGround();

    // Den (safe zone) at the bottom.
    this.add.circle(ARCTIC.den.x, ARCTIC.den.y, ARCTIC.den.radius, 0x3a2a22, 0.18);
    this.add
      .circle(ARCTIC.den.x, ARCTIC.den.y + 14, ARCTIC.den.radius * 0.7, 0x2a1d16, 0.9)
      .setDepth(1);
    this.add
      .text(ARCTIC.den.x, ARCTIC.den.y + 30, 'DEN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#e9d9c9',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Vision cone (drawn under everything else but the ground).
    this.cone = this.add.graphics().setDepth(2);

    // Snow mounds (cover).
    this.mounds.forEach((m) => this.drawMound(m.x, m.y, m.radius));

    // The fish to steal.
    this.food = this.makeFish(ARCTIC.food.x, ARCTIC.food.y, 1.3).setDepth(4);

    // Polar bear: a full body plus a head that orbits to the facing direction.
    // A soft contact shadow lifts the cream body off the pale snow.
    this.add.ellipse(ARCTIC.bear.x, ARCTIC.bear.y + 10, 152, 116, 0x6f9cba, 0.22).setDepth(4);
    this.add.image(ARCTIC.bear.x, ARCTIC.bear.y, 'bear-body').setScale(0.5).setDepth(5);
    this.bearHead = this.makeBearHead().setDepth(6);

    this.alert = this.add
      .text(ARCTIC.bear.x, ARCTIC.bear.y - 95, '!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '54px',
        color: '#ff3b30',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    // Fox (player), starts in the den.
    this.fox = this.makeFox(ARCTIC.den.x, ARCTIC.den.y - 10).setDepth(7);
    this.carriedFish = this.makeFish(0, -28, 0.78).setVisible(false);
    this.fox.add(this.carriedFish);

    this.detectBar = this.add.graphics().setDepth(8);

    this.buildHud();
    this.controls = new InputController(this);

    // On touch devices, steer from the control band below the game (Menu button included).
    if (isTouchDevice()) touchControls.enable(this, () => this.toMenu());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => touchControls.disable());
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    this.elapsed += delta;

    // Move the fox, then push it back out of any snow mound it would enter
    // (mounds are solid: you can't see through them and you can't walk through them).
    const mv = this.controls.movement;
    const r = ARCTIC.foxRadius;
    let nx = Phaser.Math.Clamp(this.fox.x + mv.x * ARCTIC.foxSpeed * dt, r, GAME_WIDTH - r);
    let ny = Phaser.Math.Clamp(this.fox.y + mv.y * ARCTIC.foxSpeed * dt, r, GAME_HEIGHT - r);
    for (const m of this.mounds) {
      const ddx = nx - m.x;
      const ddy = ny - m.y;
      const d = Math.hypot(ddx, ddy);
      const minD = m.radius + r;
      if (d < minD) {
        if (d > 0.0001) {
          nx = m.x + (ddx / d) * minD;
          ny = m.y + (ddy / d) * minD;
        } else {
          ny = m.y + minD;
        }
      }
    }
    this.fox.x = Phaser.Math.Clamp(nx, r, GAME_WIDTH - r);
    this.fox.y = Phaser.Math.Clamp(ny, r, GAME_HEIGHT - r);
    if (mv.x !== 0) this.fox.setScale(mv.x < 0 ? -1 : 1, 1);

    // Sweep the bear's gaze.
    const facing =
      Phaser.Math.DegToRad(ARCTIC.sweepBaseDeg) +
      Phaser.Math.DegToRad(ARCTIC.sweepAmplitudeDeg) *
        Math.sin((this.elapsed / ARCTIC.sweepPeriodMs) * Math.PI * 2);

    const head = {
      x: ARCTIC.bear.x + Math.cos(facing) * 40,
      y: ARCTIC.bear.y + Math.sin(facing) * 40,
    };
    this.bearHead.setPosition(head.x, head.y).setRotation(facing);

    const vis = this.foxVisibility(head, facing);
    const seen = vis === 'seen';
    this.drawCone(head, facing, vis);

    // Alarm meter fills while seen, cools while hidden.
    if (seen) {
      this.detect += delta / ARCTIC.detectTimeMs;
    } else {
      this.detect -= (delta / ARCTIC.detectTimeMs) * ARCTIC.detectDecayMult;
    }
    this.detect = Phaser.Math.Clamp(this.detect, 0, 1);
    this.alert.setVisible(this.detect > 0.05);
    this.alert.setScale(0.8 + this.detect * 0.6);
    this.drawDetectBar();

    if (this.detect >= 1) {
      this.lose();
      return;
    }

    // Bump into the bear itself and it's an instant catch.
    if (this.distanceTo(ARCTIC.bear.x, ARCTIC.bear.y) < ARCTIC.bearCatchRadius) {
      this.lose('The polar bear caught you!');
      return;
    }

    // Objective: grab the fish, then return to the den.
    if (!this.hasFood && this.distanceTo(ARCTIC.food.x, ARCTIC.food.y) < r + 22) {
      this.hasFood = true;
      this.food.setVisible(false);
      this.carriedFish.setVisible(true);
      this.hint.setText('Got it! Sneak back to the den 🦊');
    }
    if (this.hasFood && this.distanceTo(ARCTIC.den.x, ARCTIC.den.y) < ARCTIC.den.radius) {
      this.win();
    }
  }

  // --- detection -----------------------------------------------------------

  /**
   * Where the fox stands relative to the bear's gaze:
   *   'seen'    — inside the cone with a clear line of sight (you get caught),
   *   'blocked' — inside the cone but a snow mound hides you (safe — cone turns blue),
   *   'none'    — outside the cone entirely.
   */
  private foxVisibility(head: { x: number; y: number }, facing: number): 'seen' | 'blocked' | 'none' {
    const dx = this.fox.x - head.x;
    const dy = this.fox.y - head.y;
    const dist = Math.hypot(dx, dy);
    if (dist > ARCTIC.coneRange) return 'none';

    const diff = Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - facing);
    if (Math.abs(diff) > Phaser.Math.DegToRad(ARCTIC.coneHalfAngleDeg)) return 'none';

    // Blocked if any snow mound sits on the line from the bear's eyes to the fox.
    const line = new Phaser.Geom.Line(head.x, head.y, this.fox.x, this.fox.y);
    const blocked = this.mounds.some((m) => Phaser.Geom.Intersects.LineToCircle(line, m));
    return blocked ? 'blocked' : 'seen';
  }

  private distanceTo(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.fox.x, this.fox.y, x, y);
  }

  // --- drawing -------------------------------------------------------------

  private drawCone(
    head: { x: number; y: number },
    facing: number,
    vis: 'seen' | 'blocked' | 'none',
  ): void {
    const half = Phaser.Math.DegToRad(ARCTIC.coneHalfAngleDeg);
    // Red = caught, blue = sightline broken by a mound (you're hidden), yellow = clear gaze.
    const color = vis === 'seen' ? 0xff5a5a : vis === 'blocked' ? 0x55c8e6 : 0xfff0a0;
    this.cone.clear();
    this.cone.fillStyle(color, 0.18 + this.detect * 0.22);
    this.cone.slice(head.x, head.y, ARCTIC.coneRange, facing - half, facing + half, false);
    this.cone.fillPath();
  }

  private drawDetectBar(): void {
    this.detectBar.clear();
    if (this.detect <= 0.05) return;
    const w = 56;
    const x = this.fox.x - w / 2;
    const y = this.fox.y - 34;
    this.detectBar.fillStyle(0x000000, 0.35).fillRect(x - 2, y - 2, w + 4, 10);
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(255, 214, 90),
      new Phaser.Display.Color(255, 60, 60),
      100,
      this.detect * 100,
    );
    this.detectBar.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
    this.detectBar.fillRect(x, y, w * this.detect, 6);
  }

  private drawGround(): void {
    // A few faint snow patches for texture.
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xffffff, 0.5);
    const spots: [number, number, number][] = [
      [180, 220, 90],
      [1080, 180, 70],
      [240, 470, 60],
      [1040, 540, 95],
      [700, 350, 55],
    ];
    spots.forEach(([x, y, r]) => g.fillCircle(x, y, r));
  }

  private drawMound(x: number, y: number, r: number): void {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xbcd7e6, 0.9).fillEllipse(x, y + r * 0.5, r * 2.1, r * 0.9); // shadow
    g.fillStyle(0xffffff, 1).fillCircle(x, y, r);
    g.lineStyle(3, 0xd4e9f4, 1).strokeCircle(x, y, r);
  }

  // --- sprite factories ----------------------------------------------------

  // The fox sprite faces "up" (toward the bear). Movement only flips it
  // horizontally, and the carried fish sits at its mouth (offset 0,-26).
  // A soft shadow keeps the white fox readable against the pale snow.
  private makeFox(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 18, 36, 13, 0x6f9cba, 0.3);
    const fox = this.add.image(0, 0, 'fox').setScale(0.6);
    return this.add.container(x, y, [shadow, fox]);
  }

  // Built facing +x (snout to the right); the scene rotates it to the gaze angle.
  private makeBearHead(): Phaser.GameObjects.Image {
    return this.add.image(ARCTIC.bear.x, ARCTIC.bear.y, 'bear-head').setScale(0.5);
  }

  private makeFish(x: number, y: number, scale: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, 'cod').setScale(0.5 * scale);
  }

  // --- HUD + end states ----------------------------------------------------

  private buildHud(): void {
    this.hint = this.add
      .text(GAME_WIDTH / 2, 36, 'Sneak up and steal the polar bear’s fish!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
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
  }

  private win(): void {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.fadeOut(350, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Facts', { region: 'arctic' });
    });
  }

  private lose(reason = 'The polar bear spotted you!'): void {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.shake(250, 0.01);
    this.cameras.main.fadeOut(400, 40, 10, 10);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameOver', {
        stage: 'Arctic',
        reason,
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
