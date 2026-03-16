import Phaser from "phaser";
export default class CreditsScene extends Phaser.Scene {
  constructor() { super("Credits"); }
  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x111111);
    this.add.text(width/2, 90, "Credits", { fontSize: "38px", color:"#fff" }).setOrigin(0.5);
    this.add.text(width/2, height/2, "Game by Ryan\n(Click/Esc to go back)", {
      fontSize: "20px", color:"#d5d9e3", align:"center"
    }).setOrigin(0.5);
    const back = () => this.scene.start("MainMenu");
    this.input.keyboard?.once("keydown-ESC", back);
    this.input.once("pointerdown", back);
  }
}
``