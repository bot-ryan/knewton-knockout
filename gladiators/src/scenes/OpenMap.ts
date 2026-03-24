// src/scenes/OpenMap.ts
import Phaser from 'phaser';

// NEW: Import the global state object you just created
import { playerData } from '../data/playerData';

export default class OpenMap extends Phaser.Scene {
  constructor() {
    super('OpenMap');
  }

  // CHANGED: You no longer need to accept 'data' in the parameters
  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x101418);

    this.add.text(width / 2, height / 1.5, 'Character Summary', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '28px',
      color: '#e0e6f0'
    }).setOrigin(0.5);

    // CHANGED: We swap 'character' for our imported 'playerData'
    // Since playerData always exists now, we don't need the 'if (character)' check
    const lines = [
      `Name: ${playerData.name}`,
      `Skin: #${playerData.appearance.skinColor.toString(16).padStart(6, '0').toUpperCase()}`,
      `Hair: #${playerData.appearance.hairColor.toString(16).padStart(6, '0').toUpperCase()} (style ${playerData.appearance.hairStyle})`,
      `Expression: ${playerData.appearance.expression}`,
      `Stats: ${Object.entries(playerData.stats).map(([k,v]) => `${k}:${v}`).join(', ')}`,
      `HP: ${playerData.secondaryStats.hp} | MP: ${playerData.secondaryStats.mp}`,
      `ATK: ${playerData.secondaryStats.atk.min}-${playerData.secondaryStats.atk.max} | SPD: ${playerData.secondaryStats.speed}`,
      `BLK: ${playerData.secondaryStats.block}% | HIT: ${playerData.secondaryStats.hitChance}% | CRT: ${playerData.secondaryStats.crit}%`
    ];

    this.add.text(width / 2, height / 2 + 10, lines.join('\n'), {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '14px',
      color: '#9aa4b2',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 40, 'Press Esc to return to Main Menu', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '16px',
      color: '#9aa4b2'
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });
  }
}