// src/scenes/OpenMap.ts
import Phaser from 'phaser';

export default class OpenMap extends Phaser.Scene {
  constructor() {
    super('OpenMap');
  }

  create(data?: any) {
    const character = data?.character;
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x101418);

    this.add.text(width / 2, height / 2 - 40, 'OpenMap (placeholder)', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '28px',
      color: '#e0e6f0'
    }).setOrigin(0.5);

    // If the character payload arrived, show a tiny summary
    if (character) {
      const lines = [
        `Name: ${character.name}`,
        `Skin: #${character.appearance.skinColor.toString(16).padStart(6, '0').toUpperCase()}`,
        `Hair: #${character.appearance.hairColor.toString(16).padStart(6, '0').toUpperCase()} (style ${character.appearance.hairStyle})`,
        `Stats: ${Object.entries(character.stats).map(([k,v]) => `${k}:${v}`).join(', ')}`
      ];
      this.add.text(width / 2, height / 2 + 10, lines.join('\n'), {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '16px',
        color: '#9aa4b2',
        align: 'center'
      }).setOrigin(0.5);
    }

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