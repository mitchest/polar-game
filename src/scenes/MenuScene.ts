import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
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

    this.drawBackdrop();

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
        { label: 'Arctic', onSelect: () => this.chooseDifficulty('Arctic'), width: 320 },
        { label: 'Antarctic', onSelect: () => this.chooseDifficulty('Antarctic'), width: 320 },
      ],
      { x: cx, y: 400, gap: 60 },
    );

    this.add
      .text(cx, 560, 'Choose a region', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: COLORS.textDark,
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        640,
        'Keyboard: ←  →  to choose,  Space/Enter to start    •    Touch: tap a button',
        { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#477a93' },
      )
      .setOrigin(0.5);

    // Link to the source code (tap/click opens in a new tab).
    const repoUrl = 'https://github.com/mitchest/polar-game';
    const repo = this.add
      .text(cx, 692, '⟨ ⟩  github.com/mitchest/polar-game', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#2f88bd',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    repo.on('pointerover', () => repo.setColor('#ffffff'));
    repo.on('pointerout', () => repo.setColor('#2f88bd'));
    repo.on('pointerup', () => window.open(repoUrl, '_blank', 'noopener'));
  }

  // Region chosen — hand off to the Easy/Hard picker before the stage starts.
  private chooseDifficulty(region: 'Arctic' | 'Antarctic'): void {
    this.cameras.main.fadeOut(250, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Difficulty', { region });
    });
  }

  private drawBackdrop(): void {
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0x12384f, 0.55).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x73d1d2, 0.1);
    g.fillTriangle(70, 100, 390, 40, 610, 170);
    g.fillTriangle(650, 68, 1040, 28, 1220, 160);
    g.lineStyle(3, 0x9be8d8, 0.22);
    for (let i = 0; i < 5; i++) {
      const y = 90 + i * 28;
      g.beginPath();
      g.moveTo(95, y);
      g.lineTo(310, y - 55);
      g.lineTo(610, y + 16);
      g.lineTo(850, y + 70);
      g.lineTo(1180, y - 12);
      g.strokePath();
    }

    g.fillStyle(0xd8f1fa, 0.95);
    g.fillRect(0, 545, GAME_WIDTH, GAME_HEIGHT - 545);
    g.fillStyle(0xffffff, 0.88);
    g.fillEllipse(170, 548, 430, 74);
    g.fillEllipse(620, 552, 480, 88);
    g.fillEllipse(1080, 550, 410, 76);
    g.lineStyle(2, 0x9fcbe1, 0.55);
    g.beginPath();
    g.moveTo(0, 548);
    g.lineTo(205, 565);
    g.lineTo(420, 545);
    g.lineTo(680, 570);
    g.lineTo(930, 544);
    g.lineTo(1280, 562);
    g.strokePath();

    this.add.image(132, 526, 'fox').setScale(1.15).setAlpha(0.8).setDepth(-8);
    this.add.image(1045, 519, 'penguin').setScale(1.05).setAlpha(0.82).setDepth(-8);
    this.add.image(620, 558, 'bear-body').setScale(0.42).setAlpha(0.22).setDepth(-9);
  }
}
