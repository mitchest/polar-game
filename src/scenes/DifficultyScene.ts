import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, type Difficulty } from '../config';
import ButtonMenu from '../ui/ButtonMenu';
import Button from '../ui/Button';

type Region = 'Arctic' | 'Antarctic';

export interface DifficultyData {
  region: Region;
}

// What to show for each region: the stage title and a one-line "what Easy does"
// hint, so kids know the trade-off before they pick.
const REGION_INFO: Record<Region, { title: string; easyHint: string }> = {
  Arctic: {
    title: '🦊  Arctic — Sneaky Fox',
    easyHint: 'Easy: a quicker fox, a slower bear, and more time before it spots you',
  },
  Antarctic: {
    title: '🐧  Antarctic — Slippery Slide',
    easyHint: 'Easy: slower leopard seals and a shorter slide to the colony',
  },
};

/**
 * Difficulty picker shown after a region is chosen on the menu. Players must
 * choose Easy or Hard before the stage starts (Issue #3). Hard keeps the stage
 * exactly as designed; Easy is a gentler version. Fully keyboard + touch
 * navigable, like the other menu screens.
 */
export default class DifficultyScene extends Phaser.Scene {
  private region: Region = 'Arctic';

  constructor() {
    super('Difficulty');
  }

  init(data: DifficultyData): void {
    this.region = data?.region ?? 'Arctic';
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.menuBgCss);
    this.cameras.main.fadeIn(220, 14, 34, 51);
    const cx = GAME_WIDTH / 2;
    const info = REGION_INFO[this.region];

    this.add
      .text(cx, 150, info.title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '54px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 260, 'Choose your difficulty', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    new ButtonMenu(
      this,
      [
        { label: 'Easy', onSelect: () => this.start('easy'), width: 300 },
        { label: 'Hard', onSelect: () => this.start('hard'), width: 300 },
      ],
      { x: cx, y: 400, gap: 60 },
    );

    this.add
      .text(cx, 510, info.easyHint, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 548, 'Hard: the original challenge', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        color: COLORS.textMuted,
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

    // Back to the region picker (touch-friendly button + Esc on a keyboard).
    const back = new Button(this, 86, GAME_HEIGHT - 44, '❮ Menu', () => this.toMenu(), {
      width: 130,
      height: 52,
      fontSize: 22,
    });
    back.setDepth(20);
    this.input.keyboard!.on('keydown-ESC', () => this.toMenu());
  }

  private start(difficulty: Difficulty): void {
    this.cameras.main.fadeOut(220, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(this.region, { difficulty });
    });
  }

  private toMenu(): void {
    this.cameras.main.fadeOut(200, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Menu');
    });
  }
}
