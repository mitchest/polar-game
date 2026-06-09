import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

/**
 * Loads assets and shows a loading bar. We have no image/audio files yet (M0
 * uses generated placeholder art), so for now it just creates a couple of
 * reusable textures and moves on. Real asset loads will slot in here later.
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
