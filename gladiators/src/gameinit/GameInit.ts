// src/gameinit/GameInit.ts
import Phaser from "phaser";
import { loadGameFonts } from "./Fonts";
import { preloadGamePhotos } from "./Photos";

export default class Init extends Phaser.Scene {
  constructor() { super("Init"); }
  
  preload() {
    // 1. Tell Phaser to queue the photos
    preloadGamePhotos(this);
    
    // Optional: Add a simple loading text so you know it's working
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'Loading Assets...', { color: '#ffffff' }).setOrigin(0.5);
  }

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