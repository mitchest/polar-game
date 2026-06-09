import Phaser from 'phaser';
import { COLORS } from '../config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
}

/**
 * A simple rounded button that responds to both pointer (tap/click) and
 * keyboard selection. Menus drive selection with the keyboard via setSelected();
 * pointer hover also selects, and pointerdown/Enter both fire onClick.
 */
export default class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private selected = false;
  private readonly onClick: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    opts: ButtonOptions = {},
  ) {
    super(scene, x, y);
    this.onClick = onClick;

    const w = opts.width ?? 300;
    const h = opts.height ?? 96;

    this.bg = scene.add
      .rectangle(0, 0, w, h, COLORS.accent)
      .setStrokeStyle(4, 0xffffff, 0.85);
    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${opts.fontSize ?? 34}px`,
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add([this.bg, this.label]);
    scene.add.existing(this);

    this.setSize(w, h);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );

    this.on(Phaser.Input.Events.POINTER_OVER, () => this.setSelected(true));
    this.on(Phaser.Input.Events.POINTER_DOWN, () => this.fire());

    this.refresh();
  }

  setSelected(value: boolean): this {
    this.selected = value;
    this.refresh();
    return this;
  }

  /** Trigger the click action (used by both pointer and keyboard Enter/Space). */
  fire(): void {
    this.onClick();
  }

  private refresh(): void {
    this.bg.setFillStyle(this.selected ? COLORS.accentHi : COLORS.accent);
    this.setScale(this.selected ? 1.06 : 1);
  }
}
