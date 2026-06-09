import Phaser from 'phaser';

/**
 * Should we show the on-screen touch control band?
 *
 * On touch devices the gameplay stages put their controls in a dedicated band
 * *below* the game window, so your thumbs aren't covering the action. We detect
 * a touch-primary device (coarse pointer / touch points), with `?touch=1` and
 * `?touch=0` overrides for testing on a desktop.
 */
export function isTouchDevice(): boolean {
  const param = new URLSearchParams(window.location.search).get('touch');
  if (param === '1') return true;
  if (param === '0') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse || (navigator.maxTouchPoints ?? 0) > 0;
}

/**
 * The DOM touch-control band (a dynamic joystick on the left, a Menu button on
 * the right). It lives in HTML below the Phaser canvas so fingers stay off the
 * gameplay. Gameplay scenes call `enable()` in create() and `disable()` on
 * shutdown; `InputController` reads `movement` for steering.
 */
class TouchControls {
  private root: HTMLElement | null = null;
  private joyZone!: HTMLElement;
  private joyBase!: HTMLElement;
  private joyThumb!: HTMLElement;
  private joyHint!: HTMLElement;
  private menuBtn!: HTMLButtonElement;
  private game?: Phaser.Game;

  private activePointer: number | null = null;
  private origin = { x: 0, y: 0 };
  private readonly radius = 60;
  private vector = { x: 0, y: 0 };
  private menuCb: (() => void) | null = null;

  /** True while a gameplay scene is showing the band. */
  enabled = false;

  private ensureDom(): boolean {
    if (this.root) return true;
    const root = document.getElementById('touch-controls');
    if (!root) return false;
    this.root = root;
    this.joyZone = document.getElementById('joy-zone')!;
    this.joyBase = document.getElementById('joy-base')!;
    this.joyThumb = document.getElementById('joy-thumb')!;
    this.joyHint = document.getElementById('joy-hint')!;
    this.menuBtn = document.getElementById('touch-menu') as HTMLButtonElement;

    this.joyZone.addEventListener('pointerdown', this.onDown);
    this.joyZone.addEventListener('pointermove', this.onMove);
    this.joyZone.addEventListener('pointerup', this.onUp);
    this.joyZone.addEventListener('pointercancel', this.onUp);
    this.menuBtn.addEventListener('click', () => this.menuCb?.());
    return true;
  }

  /** Show the band for a gameplay scene. `menuCb` runs when Menu is tapped. */
  enable(scene: Phaser.Scene, menuCb: () => void): void {
    if (!this.ensureDom()) return;
    this.game = scene.game;
    this.menuCb = menuCb;
    this.enabled = true;
    this.resetJoystick();
    document.body.classList.add('show-touch');
    // The band shrinks the canvas area, so refit Phaser to it (now + next frame,
    // since flex layout can settle a tick late).
    scene.scale.refresh();
    requestAnimationFrame(() => scene.scale.refresh());
  }

  /** Hide the band (call on scene shutdown). */
  disable(): void {
    this.menuCb = null;
    this.enabled = false;
    this.resetJoystick();
    if (document.body.classList.contains('show-touch')) {
      document.body.classList.remove('show-touch');
      this.game?.scale.refresh();
    }
  }

  /** Current steering intent, each axis -1..1 (0,0 when idle). */
  get movement(): { x: number; y: number } {
    return this.vector;
  }

  private onDown = (e: PointerEvent): void => {
    if (this.activePointer !== null) return;
    this.activePointer = e.pointerId;
    this.joyZone.setPointerCapture(e.pointerId);
    this.origin = { x: e.clientX, y: e.clientY };
    this.placeBase(e.clientX, e.clientY);
    this.joyBase.style.opacity = '1';
    this.joyThumb.style.opacity = '1';
    this.joyHint.style.opacity = '0';
    this.applyDelta(e.clientX, e.clientY);
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.activePointer) return;
    this.applyDelta(e.clientX, e.clientY);
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.activePointer) return;
    this.resetJoystick();
  };

  private applyDelta(clientX: number, clientY: number): void {
    const dx = clientX - this.origin.x;
    const dy = clientY - this.origin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.radius);
    const angle = Math.atan2(dy, dx);
    const tx = Math.cos(angle) * clamped;
    const ty = Math.sin(angle) * clamped;
    this.vector = { x: tx / this.radius, y: ty / this.radius };

    const rect = this.joyZone.getBoundingClientRect();
    this.joyThumb.style.left = `${this.origin.x - rect.left + tx}px`;
    this.joyThumb.style.top = `${this.origin.y - rect.top + ty}px`;
  }

  private placeBase(clientX: number, clientY: number): void {
    const rect = this.joyZone.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    this.joyBase.style.left = `${x}px`;
    this.joyBase.style.top = `${y}px`;
    this.joyThumb.style.left = `${x}px`;
    this.joyThumb.style.top = `${y}px`;
  }

  private resetJoystick(): void {
    this.activePointer = null;
    this.vector = { x: 0, y: 0 };
    if (this.joyBase) {
      this.joyBase.style.opacity = '0';
      this.joyThumb.style.opacity = '0';
      this.joyHint.style.opacity = this.enabled ? '1' : '0';
    }
  }
}

export const touchControls = new TouchControls();
