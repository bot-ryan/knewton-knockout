import Phaser from "phaser";
export default class CharacterCreateScene extends Phaser.Scene {
  constructor() { super("CharacterCreate"); }
  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x0b0f1a);
    this.add.text(width/2, height/2, "Character Creation (placeholder)", {
      fontSize: "24px", color:"#fff"
    }).setOrigin(0.5);
    this.add.text(width/2, height*0.8, "Press Esc to return to Main Menu", {
      fontSize: "16px", color:"#9aa4b2"
    }).setOrigin(0.5);
    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("MainMenu"));
  }
}
``