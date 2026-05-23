// src/components/ui/LogBox.ts
import Phaser from 'phaser';

export class LogBox extends Phaser.GameObjects.Container {
    private text: Phaser.GameObjects.Text;
    private tooltipText: Phaser.GameObjects.Text; // NEW: Dedicated tooltip text
    private history: string[] = [];
    private boxHeight: number;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        super(scene, x, y);
        this.boxHeight = height;

        // 1. Draw the Background
        const bg = scene.add.graphics();
        bg.fillStyle(0x07080d, 0.85);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, 0x22253a, 1);
        bg.strokeRoundedRect(0, 0, width, height, 8);

        // 2. Create the standard History Text
        this.text = scene.add.text(20, 15, '', {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#cbd5e1',
            wordWrap: { width: width - 40 },
            lineSpacing: 8
        });

        // 3. Create the Tooltip Text (Hidden by default)
        this.tooltipText = scene.add.text(20, 15, '', {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#fbbf24', // Yellow/Amber to signify it's a tooltip
            fontStyle: 'italic', // Make it italic to differentiate from logs
            wordWrap: { width: width - 40 }
        });
        this.tooltipText.setVisible(false);

        // 4. Add all to container
        this.add([bg, this.text, this.tooltipText]);
        scene.add.existing(this);
    }

    public log(message: string) {
        this.history.push(message);
        this.text.setText(this.history.join('\n'));

        // The math here still works perfectly even if the text object is hidden!
        while (this.text.height > this.boxHeight - 30) {
            this.history.shift();
            this.text.setText(this.history.join('\n'));
        }
    }

    // --- NEW TOOLTIP METHODS ---

    public showTooltip(message: string) {
        this.text.setVisible(false);         // Hide history
        this.tooltipText.setText(message);   // Set tooltip text
        this.tooltipText.setVisible(true);   // Show tooltip
    }

    public clearTooltip() {
        this.tooltipText.setVisible(false);  // Hide tooltip
        this.text.setVisible(true);          // Bring history back
    }
}