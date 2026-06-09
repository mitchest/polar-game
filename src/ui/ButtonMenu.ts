import Phaser from 'phaser';
import Button from './Button';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  width?: number;
}

export interface ButtonMenuOptions {
  x: number;
  y: number;
  gap?: number;
  horizontal?: boolean;
  buttonHeight?: number;
  fontSize?: number;
}

/**
 * A row or column of buttons that's navigable by keyboard (arrows/WASD to move,
 * Space/Enter to activate) and by pointer (hover selects, tap/click activates).
 * Used by the menu and the win/lose screens so they all behave the same.
 */
export default class ButtonMenu {
  private buttons: Button[] = [];
  private index = 0;
  private horizontal: boolean;

  constructor(scene: Phaser.Scene, items: MenuItem[], opts: ButtonMenuOptions) {
    this.horizontal = opts.horizontal ?? true;
    const gap = opts.gap ?? 40;
    const defaultW = this.horizontal ? 300 : 360;

    // Lay buttons out centred on (x, y).
    const sizes = items.map((it) => it.width ?? defaultW);
    const along = this.horizontal
      ? sizes.reduce((a, b) => a + b, 0) + gap * (items.length - 1)
      : (opts.buttonHeight ?? 84) * items.length + gap * (items.length - 1);

    let cursor = (this.horizontal ? opts.x : opts.y) - along / 2;

    items.forEach((item, i) => {
      const w = sizes[i];
      const h = opts.buttonHeight ?? (this.horizontal ? 90 : 84);
      let bx = opts.x;
      let by = opts.y;
      if (this.horizontal) {
        bx = cursor + w / 2;
        cursor += w + gap;
      } else {
        by = cursor + h / 2;
        cursor += h + gap;
      }

      const btn = new Button(scene, bx, by, item.label, item.onSelect, {
        width: w,
        height: h,
        fontSize: opts.fontSize,
      });
      btn.on(Phaser.Input.Events.POINTER_OVER, () => this.select(i));
      this.buttons.push(btn);
    });

    this.bindKeyboard(scene);
    this.select(0);
  }

  private bindKeyboard(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard!;
    const prev = this.horizontal ? ['LEFT', 'A'] : ['UP', 'W'];
    const next = this.horizontal ? ['RIGHT', 'D'] : ['DOWN', 'S'];
    prev.forEach((k) => kb.on(`keydown-${k}`, () => this.move(-1)));
    next.forEach((k) => kb.on(`keydown-${k}`, () => this.move(1)));
    kb.on('keydown-SPACE', () => this.activate());
    kb.on('keydown-ENTER', () => this.activate());
  }

  private move(delta: number): void {
    this.select(Phaser.Math.Wrap(this.index + delta, 0, this.buttons.length));
  }

  private select(index: number): void {
    this.index = index;
    this.buttons.forEach((b, i) => b.setSelected(i === index));
  }

  private activate(): void {
    this.buttons[this.index]?.fire();
  }
}
