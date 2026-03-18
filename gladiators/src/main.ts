import './style.css';
import Phaser from 'phaser';

import GameInit from './gameinit/GameInit';               // boot scene
import MainMenuScene from './scenes/MainMenuScene';
import HowToPlayScene from './scenes/HowToPlayScene';
import CreditsScene from './scenes/CreditsScene';
import CharacterCreateScene from './scenes/CharacterCreateScene';
import OpenMap from './scenes/OpenMap';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',                 // <div id="game"></div> in index.html
  width: 1280,                    // pick one baseline; 1024x576 == 16:9
  height: 720,
  backgroundColor: '#0b0f1a',
  scene: [
    // Order matters: boot first, then main menu, etc.
    GameInit,
    MainMenuScene,
    HowToPlayScene,
    CreditsScene,
    CharacterCreateScene,
    OpenMap,
  ],
  dom: { createContainer: true }, // required for HTML <input> in CharacterCreate
  scale: {
    mode: Phaser.Scale.FIT,    // responsive sizing
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Optional tweaks depending on your art style:
  // render: { pixelArt: true, antialias: false },
};

new Phaser.Game(config);