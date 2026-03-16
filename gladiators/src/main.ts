import Phaser from "phaser";
import MainMenuScene from "./scenes/MainMenuScene";
// If you created placeholder scenes, import them too:
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
    MainMenuScene,
    HowToPlayScene,
    CreditsScene,
    CharacterCreateScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);