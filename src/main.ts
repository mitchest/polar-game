import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config';
import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import MenuScene from './scenes/MenuScene';
import DifficultyScene from './scenes/DifficultyScene';
import ArcticScene from './scenes/ArcticScene';
import AntarcticScene from './scenes/AntarcticScene';
import GameOverScene from './scenes/GameOverScene';
import FactsScene from './scenes/FactsScene';

// Default to WebGL (Phaser.AUTO), but allow ?renderer=canvas to force the 2D
// canvas backend — useful on machines with flaky/headless WebGL.
const rendererParam = new URLSearchParams(window.location.search).get('renderer');
const rendererType = rendererParam === 'canvas' ? Phaser.CANVAS : Phaser.AUTO;

const config: Phaser.Types.Core.GameConfig = {
  type: rendererType,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.menuBgCss,
  scale: {
    // Landscape design resolution, scaled to fit any screen and centred.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  input: {
    // Allow several simultaneous touches (joystick + a future action button).
    activePointers: 3,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    DifficultyScene,
    ArcticScene,
    AntarcticScene,
    GameOverScene,
    FactsScene,
  ],
};

export default new Phaser.Game(config);
