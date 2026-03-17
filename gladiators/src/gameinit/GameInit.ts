// src/gameinit/GameInit.ts
import Phaser from "phaser";
import { loadGameFonts } from "./Fonts";

export default class Init extends Phaser.Scene {
  constructor() { super("Init"); }

  async create() {
    try {
      await loadGameFonts();
      console.log('[GameInit] Fonts loaded, starting MainMenu');
    } catch (err) {
      console.warn('[GameInit] Font load failed, continuing anyway', err);
    }
    this.scene.start("MainMenu");
  }
}