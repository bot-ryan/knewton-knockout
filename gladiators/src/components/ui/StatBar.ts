// src/components/ui/StatBar.ts
import Phaser from 'phaser';

/**
 * StatBar is a reusable UI component that displays a value (such as HP, MP, or Stamina)
 * as a progress bar. It manages a grey background wrapper, a colored interior fill,
 * and a center-aligned numeric string label.
 * * @example
 * // Usage in a Combat Scene or Status Menu:
 * // Creates a red health bar at (40, 75) with a width of 200px and height of 16px
 * this.playerHpBar = new StatBar(this, 40, 75, 200, 16, 0xef4444);
 * * // Updating values when damage is taken or points are spent:
 * this.playerHpBar.update(75, 100); // Displays "75/100" and sets fill to 75%
 * * @example
 * // Reusing in a different scene (e.g., a Boss Fight or Shop Scene):
 * const bossHp = new StatBar(this, centerX, 50, 400, 24, 0x991b1b);
 * bossHp.update(boss.currentHp, boss.maxHp);
 */

export class StatBar extends Phaser.GameObjects.Container {
    private bar: Phaser.GameObjects.Graphics;
    private background: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    
    // RENAMED THESE to avoid collision with Phaser's built-in width/height
    private barWidth: number;
    private barHeight: number; 
    private color: number;

    /**
     * Creates an instance of a StatBar.
     * @param scene - The Phaser Scene this bar belongs to.
     * @param x - The horizontal position of the bar's top-left corner.
     * @param y - The vertical position of the bar's top-left corner.
     * @param width - The physical total width of the bar in pixels.
     * @param height - The physical height of the bar in pixels.
     * @param color - The hex color code for the bar fill (e.g., 0xef4444 for red).
     */
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number) {
        super(scene, x, y);
        this.barWidth = width;
        this.barHeight = height;
        this.color = color;

        // 1. Background
        this.background = scene.add.graphics();
        this.background.fillStyle(0x222222, 1);
        this.background.fillRect(0, 0, width, height);
        this.background.lineStyle(2, 0x000000, 1);
        this.background.strokeRect(0, 0, width, height);

        // 2. Bar
        this.bar = scene.add.graphics();

        // 3. Text
        this.text = scene.add.text(width / 2, height / 2, '', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add([this.background, this.bar, this.text]);
        scene.add.existing(this);
    }

    /**
     * Updates the inner bar fill percentage and redraws the text readout string.
     * Clamps values automatically to ensure the bar never draws out of bounds.
     * @param current - The current value of the stat (e.g., current HP).
     * @param max - The maximum pool value of the stat (e.g., maximum possible HP).
     */
    public update(current: number, max: number) {
        const percentage = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;

        // Draw the bar fill using the renamed barWidth/barHeight
        this.bar.clear();
        this.bar.fillStyle(this.color, 1);
        this.bar.fillRect(0, 0, this.barWidth * percentage, this.barHeight);

        this.text.setText(`${current}/${max}`);
    }
}