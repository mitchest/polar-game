import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ARCTIC, arcticTuning, type Difficulty } from '../config';
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
  private difficulty: Difficulty = 'hard';
  private tuned = arcticTuning('hard'); // difficulty-adjusted speeds/timings (set in create)

  constructor() {
    super('Arctic');
  }

  init(data?: { difficulty?: Difficulty }): void {
    // Default to 'hard' (the original tuning) so the ?scene=Arctic dev jump and
    // any direct start still behave like before.
    this.difficulty = data?.difficulty ?? 'hard';
  }

  create(): void {
    this.tuned = arcticTuning(this.difficulty);
    this.elapsed = 0;
    this.detect = 0;
    this.hasFood = false;
    this.ended = false;

    this.cameras.main.setBackgroundColor('#eaf6fb');
    this.cameras.main.fadeIn(250, 14, 34, 51);

    this.drawGround();

    this.drawDen();

    // Vision cone (drawn under everything else but the ground).
    this.cone = this.add.graphics().setDepth(2);

    // Snow mounds (cover).
    this.mounds.forEach((m) => this.drawMound(m.x, m.y, m.radius));

    // The fish to steal.
    this.food = this.makeFish(ARCTIC.food.x, ARCTIC.food.y, 1.3).setDepth(4);

    // Polar bear: a full body plus a head tucked into the shoulders and rotated
    // toward the gaze direction.
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
    this.carriedFish = this.makeFish(0, -11, 0.72).setVisible(false);
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
    let nx = Phaser.Math.Clamp(this.fox.x + mv.x * this.tuned.foxSpeed * dt, r, GAME_WIDTH - r);
    let ny = Phaser.Math.Clamp(this.fox.y + mv.y * this.tuned.foxSpeed * dt, r, GAME_HEIGHT - r);
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
        Math.sin((this.elapsed / this.tuned.sweepPeriodMs) * Math.PI * 2);

    const head = {
      x: ARCTIC.bear.x + Math.cos(facing) * 22,
      y: ARCTIC.bear.y + Math.sin(facing) * 22 + 6,
    };
    this.bearHead.setPosition(head.x, head.y).setRotation(facing);

    const vis = this.foxVisibility(head, facing);
    const seen = vis === 'seen';
    this.drawCone(head, facing, vis);

    // Alarm meter fills while seen, cools while hidden.
    if (seen) {
      this.detect += delta / this.tuned.detectTimeMs;
    } else {
      this.detect -= (delta / this.tuned.detectTimeMs) * ARCTIC.detectDecayMult;
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
      this.hint.setText('Got it! Sneak back to the den');
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
    // Layered snow texture: soft drifts, wind-sculpted ridges, and faint tracks.
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

    g.lineStyle(2, 0xc9e3f0, 0.34);
    const ridges: [number, number, number, number][] = [
      [90, 120, 360, 80],
      [760, 110, 1130, 80],
      [120, 350, 390, 320],
      [820, 405, 1180, 365],
      [70, 610, 360, 575],
      [930, 650, 1210, 615],
    ];
    ridges.forEach(([x1, y1, x2, y2]) => {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo((x1 + x2) / 2, y1 - 20);
      g.lineTo(x2, y2);
      g.strokePath();
    });

    g.fillStyle(0xb6d8e9, 0.22);
    const prints: [number, number, number][] = [
      [470, 615, -0.35],
      [500, 588, -0.2],
      [526, 558, -0.15],
      [560, 535, 0.1],
      [730, 612, 0.35],
      [705, 582, 0.22],
      [676, 554, 0.15],
    ];
    prints.forEach(([x, y, rot]) => {
      g.save();
      g.translateCanvas(x, y);
      g.rotateCanvas(rot);
      g.fillEllipse(-5, 0, 9, 5);
      g.fillEllipse(5, -1, 9, 5);
      g.restore();
    });
  }

  private drawDen(): void {
    const { x, y, radius } = ARCTIC.den;
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x9bbdd0, 0.22).fillEllipse(x, y + 24, radius * 2.2, radius * 0.7);
    g.fillStyle(0xffffff, 0.95).fillEllipse(x, y - 2, radius * 2.05, radius * 1.1);
    g.lineStyle(4, 0xd2e8f3, 1).strokeEllipse(x, y - 2, radius * 2.05, radius * 1.1);
    g.fillStyle(0x4a3428, 0.32).fillEllipse(x, y + 16, radius * 1.25, radius * 0.62);
    g.fillStyle(0x2a1d16, 0.94).fillEllipse(x, y + 20, radius * 0.92, radius * 0.5);
    g.fillStyle(0xffffff, 0.55).fillEllipse(x - radius * 0.28, y - 24, radius * 0.58, radius * 0.18);

    this.add
      .text(x, y + 30, 'DEN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#efe1d1',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  private drawMound(x: number, y: number, r: number): void {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x9fc4d8, 0.45).fillEllipse(x, y + r * 0.48, r * 2.18, r * 0.86); // shadow
    g.fillStyle(0xffffff, 1).fillCircle(x, y, r);
    g.fillStyle(0xe3f3fa, 0.85).fillEllipse(x + r * 0.16, y + r * 0.24, r * 1.22, r * 0.72);
    g.fillStyle(0xffffff, 0.72).fillEllipse(x - r * 0.2, y - r * 0.18, r * 0.9, r * 0.44);
    g.lineStyle(3, 0xcfe7f3, 1).strokeCircle(x, y, r);
    g.lineStyle(2, 0xb8d8e9, 0.55);
    g.beginPath();
    g.moveTo(x - r * 0.48, y + r * 0.08);
    g.lineTo(x - r * 0.08, y + r * 0.28);
    g.lineTo(x + r * 0.46, y + r * 0.1);
    g.strokePath();
  }

  // --- sprite factories ----------------------------------------------------

  // The fox sprite faces "up" (toward the bear). Movement only flips it
  // horizontally, and the carried fish is held at its mouth/front (offset 0,-11).
  // A soft shadow keeps the white fox readable against the pale snow.
  private makeFox(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 18, 36, 13, 0x6f9cba, 0.3);
    const fox = this.add.image(0, 0, 'fox').setScale(0.6);
    return this.add.container(x, y, [shadow, fox]);
  }

  // Built facing +x (snout to the right); the scene rotates it to the gaze angle.
  private makeBearHead(): Phaser.GameObjects.Image {
    return this.add.image(ARCTIC.bear.x, ARCTIC.bear.y, 'bear-head').setScale(0.6);
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
