import Phaser from 'phaser';

/**
 * Tiny first scene. Nothing heavy here yet — it just hands straight off to the
 * Preload scene. Kept separate so future global setup has a home.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    // Dev convenience: ?scene=Arctic (or Antarctic/Migratory/Menu) jumps straight
    // there, skipping the menu — handy for testing a single stage in isolation.
    const requested = new URLSearchParams(window.location.search).get('scene');
    const valid = ['Menu', 'Difficulty', 'Arctic', 'Antarctic', 'Migratory', 'Facts', 'GameOver'];
    if (requested && valid.includes(requested)) {
      this.scene.start('Preload', { next: requested });
      return;
    }
    this.scene.start('Preload');
  }
}
