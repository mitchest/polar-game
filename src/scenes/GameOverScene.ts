import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, type Difficulty } from '../config';
import ButtonMenu from '../ui/ButtonMenu';

export interface GameOverData {
  stage: 'Arctic' | 'Antarctic';
  reason: string;
  difficulty: Difficulty;
}

/**
 * Friendly lose screen. Says what happened and offers Try again (restart that
 * stage) or Menu. Keyboard + touch navigable.
 */
export default class GameOverScene extends Phaser.Scene {
  private payload!: GameOverData;

  constructor() {
    super('GameOver');
  }

  init(data: GameOverData): void {
    this.payload = data?.stage
      ? data
      : { stage: 'Arctic', reason: 'The polar bear spotted you!', difficulty: 'hard' };
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1b28');
    this.cameras.main.fadeIn(220, 11, 27, 40);
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, GAME_HEIGHT * 0.3, 'Caught!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '76px',
        color: '#ff8a73',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.3 + 80, this.payload.reason, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    new ButtonMenu(
      this,
      [
        { label: 'Try again', onSelect: () => this.retry(), width: 300 },
        { label: 'Menu', onSelect: () => this.go('Menu'), width: 260 },
      ],
      { x: cx, y: GAME_HEIGHT * 0.62, gap: 50 },
    );
  }

  // Replay the same stage at the same difficulty the player just lost on.
  private retry(): void {
    this.cameras.main.fadeOut(200, 11, 27, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(this.payload.stage, { difficulty: this.payload.difficulty });
    });
  }

  private go(key: string): void {
    this.cameras.main.fadeOut(200, 11, 27, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(key);
    });
  }
}
