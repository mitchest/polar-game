import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

/**
 * Loads assets and shows a loading bar.
 *
 * Character art is hand-authored SVG (in `public/assets/images`). We rasterise
 * each at 2x via `{ scale: 2 }` so it stays crisp on retina/high-DPI screens,
 * then every sprite is drawn at `setScale(0.5)` so it displays at its authored
 * size. SVGs are tiny, scale cleanly, and can be swapped for nicer art later
 * without touching gameplay code.
 */
export default class PreloadScene extends Phaser.Scene {
  private next = 'Menu';

  constructor() {
    super('Preload');
  }

  init(data: { next?: string }): void {
    if (data?.next) this.next = data.next;
  }

  preload(): void {
    this.drawLoadingBar();

    // A 1x1 white texture, handy for particles/tints later.
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
    g.generateTexture('pixel', 4, 4);
    g.destroy();

    // Character art. Rasterised at 2x for crispness (drawn at 0.5 scale).
    this.load.svg('fox', 'assets/images/fox.svg', { scale: 2 });
    this.load.svg('bear-body', 'assets/images/polar-bear-body.svg', { scale: 2 });
    this.load.svg('bear-head', 'assets/images/polar-bear-head.svg', { scale: 2 });
    this.load.svg('cod', 'assets/images/cod.svg', { scale: 2 });
    this.load.svg('penguin', 'assets/images/penguin.svg', { scale: 2 });
    this.load.svg('leopard-seal', 'assets/images/leopard-seal.svg', { scale: 2 });
    this.load.svg('ice-hole', 'assets/images/ice-hole.svg', { scale: 2 });
    this.load.svg('tern', 'assets/images/arctic-tern.svg', { scale: 2 });
    this.load.svg('orca', 'assets/images/orca.svg', { scale: 2 });
    this.load.svg('seabird', 'assets/images/albatross.svg', { scale: 2 });
  }

  create(): void {
    this.scene.start(this.next);
  }

  private drawLoadingBar(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .text(cx, cy - 60, 'Life in the Freezers', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const barW = 420;
    const barH = 26;
    this.add
      .rectangle(cx, cy + 20, barW, barH)
      .setStrokeStyle(3, 0xffffff, 0.8);
    const fill = this.add
      .rectangle(cx - barW / 2 + 3, cy + 20, 0, barH - 6, COLORS.accentHi)
      .setOrigin(0, 0.5);

    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      fill.width = (barW - 6) * p;
    });
  }
}
