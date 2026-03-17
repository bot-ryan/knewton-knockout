import "./style.css";
import Phaser from "phaser";

import Init from "./gameinit/Init"; // <-- your boot scene
import MainMenuScene from "./scenes/MainMenuScene";
import HowToPlayScene from "./scenes/HowToPlayScene";
import CreditsScene from "./scenes/CreditsScene";
import CharacterCreateScene from "./scenes/CharacterCreateScene";




const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: "#101322",
  parent: "game", // <-- attaches to <div id="game">
  scene: [
    Init, // <-- game initialization and global setup (e.g., fonts)
    MainMenuScene,
    HowToPlayScene,
    CreditsScene,
    CharacterCreateScene,
  ],
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);