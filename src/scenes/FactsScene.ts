import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import ButtonMenu from '../ui/ButtonMenu';
import { FACTS, REGION_TITLE, type Region } from '../data/facts';

export interface FactsData {
  region: Region;
}

/**
 * Win / facts ending. Reached by clearing either stage. Shows a celebratory
 * message and the polar facts for that region, then offers the other stage or
 * the menu. (M3 will give this the full animated treatment; this is a solid
 * first version with falling snow and staggered fact reveals.)
 */
export default class FactsScene extends Phaser.Scene {
  private region: Region = 'arctic';

  constructor() {
    super('Facts');
  }

  init(data: FactsData): void {
    this.region = data?.region ?? 'arctic';
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.menuBgCss);
    this.cameras.main.fadeIn(300, 14, 34, 51);
    const cx = GAME_WIDTH / 2;

    this.addSnow();

    this.add
      .text(cx, 70, 'You made it!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '60px',
        color: '#9be8a0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 128, REGION_TITLE[this.region], {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    // Fact cards, faded in one after another.
    const facts = FACTS[this.region];
    const top = 185;
    const cardH = 64;
    const cardGap = 12;
    facts.forEach((text, i) => {
      const y = top + i * (cardH + cardGap);
      const card = this.add.container(cx, y);

      const bg = this.add
        .rectangle(0, 0, 1000, cardH, 0xffffff, 0.06)
        .setStrokeStyle(2, 0xffffff, 0.18);
      const dot = this.add.circle(-470, 0, 7, COLORS.accentHi);
      const label = this.add
        .text(-445, 0, text, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '21px',
          color: COLORS.text,
          wordWrap: { width: 900 },
          lineSpacing: 3,
        })
        .setOrigin(0, 0.5);

      card.add([bg, dot, label]);
      // Cards are visible by default; the tween is a cosmetic slide-in so the
      // content is never hidden behind an animation that might not run.
      card.setX(cx - 28);
      this.tweens.add({
        targets: card,
        x: cx,
        delay: i * 110,
        duration: 340,
        ease: 'Sine.out',
      });
    });

    const other: 'Arctic' | 'Antarctic' =
      this.region === 'arctic' ? 'Antarctic' : 'Arctic';

    new ButtonMenu(
      this,
      [
        { label: `Play ${other}`, onSelect: () => this.go(other), width: 320 },
        { label: 'Menu', onSelect: () => this.go('Menu'), width: 240 },
      ],
      { x: cx, y: GAME_HEIGHT - 90, gap: 50, buttonHeight: 78 },
    );

    this.add
      .text(GAME_WIDTH - 24, GAME_HEIGHT - 24, 'by Moss', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: COLORS.textMuted,
      })
      .setOrigin(1, 1);
  }

  private addSnow(): void {
    this.add
      .particles(0, -10, 'pixel', {
        x: { min: 0, max: GAME_WIDTH },
        y: -10,
        lifespan: 9000,
        speedY: { min: 25, max: 70 },
        speedX: { min: -15, max: 15 },
        scale: { min: 1, max: 3 },
        alpha: { min: 0.25, max: 0.7 },
        frequency: 120,
        quantity: 1,
      })
      .setDepth(-1);
  }

  private go(key: string): void {
    this.cameras.main.fadeOut(250, 14, 34, 51);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(key);
    });
  }
}
