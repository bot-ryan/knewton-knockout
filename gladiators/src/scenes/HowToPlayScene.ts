import Phaser from "phaser";
import { SceneKeys } from "../data/SceneKeys";
import { ButtonCreator } from "../components/ButtonCreator";
export default class HowToPlayScene extends Phaser.Scene {
  constructor() { super(SceneKeys.HowToPlay); }
  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x0e1a2b);
    this.add.text(width/2, 90, "How to Play", { fontSize: "38px", color:"#fff" }).setOrigin(0.5);
    this.add.text(width/2, height/2, "Instructions...\n(Click/Esc to go back)", {
      fontSize: "20px", color:"#d5d9e3", align:"center"
    }).setOrigin(0.5);
    const back = () => this.scene.start(SceneKeys.MainMenu);
    this.input.keyboard?.once("keydown-ESC", back);
    this.input.once("pointerdown", back);
  }
}