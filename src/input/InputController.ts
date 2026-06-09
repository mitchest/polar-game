import Phaser from 'phaser';
import { touchControls } from './TouchControls';

/**
 * One shared input layer for the whole game.
 *
 * Gameplay code asks for a *movement vector* and an *action press* and never
 * needs to know whether they came from a keyboard or a finger:
 *   - Keyboard: arrow keys / WASD to move, Space/Enter for "action".
 *   - Touch: the on-screen control band below the game (see TouchControls).
 *   - Mouse / touchscreen laptop: a dynamic virtual joystick that appears where
 *     you press on the canvas, plus a quick tap (that isn't a drag) = "action".
 *
 * When the touch band is active (`touchControls.enabled`) it owns steering and
 * the on-canvas joystick is suppressed, so fingers stay off the gameplay.
 */
export default class InputController {
  private scene: Phaser.Scene;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;

  // Virtual joystick state.
  private joyBase?: Phaser.GameObjects.Arc;
  private joyThumb?: Phaser.GameObjects.Arc;
  private joyPointerId: number | null = null;
  private joyOrigin = new Phaser.Math.Vector2();
  private joyVector = new Phaser.Math.Vector2(); // -1..1 on each axis
  private readonly joyRadius = 70;

  // Tap detection (a short press that doesn't become a drag = "action").
  private pointerDownAt = 0;
  private pointerMovedFar = false;
  private touchActionQueued = false;

  private destroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEnter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);

    // Clean up automatically when the scene shuts down.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  /** Current movement intent as a vector with length 0..1. */
  get movement(): Phaser.Math.Vector2 {
    // Touch control band takes priority while it's showing.
    if (touchControls.enabled) {
      const t = touchControls.movement;
      if (t.x !== 0 || t.y !== 0) {
        return new Phaser.Math.Vector2(t.x, t.y).limit(1);
      }
    } else if (this.joyPointerId !== null && this.joyVector.lengthSq() > 0) {
      return this.joyVector.clone().limit(1);
    }

    const v = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown || this.keyA.isDown) v.x -= 1;
    if (this.cursors.right.isDown || this.keyD.isDown) v.x += 1;
    if (this.cursors.up.isDown || this.keyW.isDown) v.y -= 1;
    if (this.cursors.down.isDown || this.keyS.isDown) v.y += 1;
    if (v.lengthSq() > 0) v.normalize();
    return v;
  }

  /**
   * True for one read when the action input fires (Space/Enter just pressed, or
   * a quick screen tap). Consume it once per frame.
   */
  get actionJustPressed(): boolean {
    const keyAction =
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      Phaser.Input.Keyboard.JustDown(this.keyEnter);
    if (keyAction) return true;
    if (this.touchActionQueued) {
      this.touchActionQueued = false;
      return true;
    }
    return false;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // The touch band owns steering; don't spawn an on-canvas joystick over the game.
    if (touchControls.enabled) return;
    // If the press landed on an interactive UI object (a button), leave it alone.
    if (this.scene.input.hitTestPointer(pointer).length > 0) return;
    if (this.joyPointerId !== null) return; // already tracking one finger

    this.joyPointerId = pointer.id;
    this.joyOrigin.set(pointer.x, pointer.y);
    this.joyVector.set(0, 0);
    this.pointerDownAt = this.scene.time.now;
    this.pointerMovedFar = false;
    this.showJoystick(pointer.x, pointer.y);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joyPointerId) return;

    const dx = pointer.x - this.joyOrigin.x;
    const dy = pointer.y - this.joyOrigin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 12) this.pointerMovedFar = true;

    const clamped = Math.min(dist, this.joyRadius);
    const angle = Math.atan2(dy, dx);
    const tx = Math.cos(angle) * clamped;
    const ty = Math.sin(angle) * clamped;

    this.joyVector.set(tx / this.joyRadius, ty / this.joyRadius);
    this.joyThumb?.setPosition(this.joyOrigin.x + tx, this.joyOrigin.y + ty);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joyPointerId) return;

    // A short, near-stationary press counts as an action tap.
    const heldFor = this.scene.time.now - this.pointerDownAt;
    if (!this.pointerMovedFar && heldFor < 250) {
      this.touchActionQueued = true;
    }

    this.joyPointerId = null;
    this.joyVector.set(0, 0);
    this.hideJoystick();
  }

  private showJoystick(x: number, y: number): void {
    if (!this.joyBase) {
      this.joyBase = this.scene.add
        .circle(x, y, this.joyRadius, 0xffffff, 0.12)
        .setStrokeStyle(3, 0xffffff, 0.4)
        .setScrollFactor(0)
        .setDepth(1000);
      this.joyThumb = this.scene.add
        .circle(x, y, this.joyRadius * 0.45, 0xffffff, 0.35)
        .setScrollFactor(0)
        .setDepth(1001);
    }
    this.joyBase.setPosition(x, y).setVisible(true);
    this.joyThumb!.setPosition(x, y).setVisible(true);
  }

  private hideJoystick(): void {
    this.joyBase?.setVisible(false);
    this.joyThumb?.setVisible(false);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
    this.joyBase?.destroy();
    this.joyThumb?.destroy();
  }
}
