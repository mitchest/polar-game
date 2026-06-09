import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import ButtonMenu from '../ui/ButtonMenu';

/**
 * Title + the two entry points (Arctic / Antarctic). Fully navigable by both
 * keyboard (Left/Right to choose, Space/Enter to start) and pointer (hover +
 * tap/click).
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.menuBgCss);
    this.cameras.main.fadeIn(250, 14, 34, 51);
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 150, 'Life in the Freezers', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '68px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 215, 'a polar adventure — by Moss', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    new ButtonMenu(
      this,
      [
        { label: 'Arctic', onSelect: () => this.startStage('Arctic'), width: 320 },
        { label: 'Antarctic', onSelect: () => this.startStage('Antarctic'), width: 320 },
      ],
      { x: cx, y: 400, gap: 60 },
    );

    this.add
      .text(cx, 560, 'Choose a region', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        640,
        'Keyboard: ←  →  to choose,  Space/Enter to start    •    Touch: tap a button',
        { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: COLORS.textMuted },
      )
      .setOrigin(0.5);
  }

  private startStage(key: 'Arctic' | 'Antarctic'): void {
    this.cameras.main.fadeOut(250, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(key);
    });
  }
}
