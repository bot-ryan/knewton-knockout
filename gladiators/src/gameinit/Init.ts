// src/gameinit/Init.ts
import Phaser from "phaser";
import { loadGameFonts } from "./Fonts"; // <-- import your font loader

export default class Init extends Phaser.Scene {
  constructor() {
    super("Init"); // <-- scene key; change if you want (e.g., "GameInit")
  }

  preload() {
    // Optional: ultra-light assets you need *before* any preloader (e.g., a tiny logo)
    // this.load.image('boot-logo', 'assets/ui/boot_logo.png');
  }

  async create() {
    // 1) One-time global setup: load fonts (and later: saves, plugins, flags)
    await loadGameFonts();

    // 2) Hand off to the next scene.
    console.log('Loaded fonts, starting MainMenu')
    // If you add a Preloader later, start that instead; for now go straight to menu.
    this.scene.start("MainMenu");
  }
}