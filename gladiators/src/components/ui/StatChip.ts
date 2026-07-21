// src/components/ui/StatChip.ts
export type StatChipIcon = 'hp' | 'stamina' | 'gold';

export class StatChip extends Phaser.GameObjects.Container {
    private valueText: Phaser.GameObjects.Text;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        icon: StatChipIcon,
        value: number,
        max?: number // optional — shows "30/30" if provided, just "30" if not
    ) {
        super(scene, x, y);

        const icons: Record<StatChipIcon, string> = {
            hp:      '❤️',
            stamina: '⚡',
            gold:    '🪙'
        };

        const iconText = scene.add.text(0, 0, icons[icon], {
            fontSize: '20px'
        }).setOrigin(0, 0.5);

        const label = max !== undefined ? `${value}/${max}` : `${value}`;
        this.valueText = scene.add.text(30, 0, label, {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.add([iconText, this.valueText]);
        scene.add.existing(this);
    }

    update(value: number, max?: number) {
        const label = max !== undefined ? `${value}/${max}` : `${value}`;
        this.valueText.setText(label);
    }
}