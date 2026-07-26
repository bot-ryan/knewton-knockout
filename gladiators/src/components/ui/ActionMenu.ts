// src/components/ui/ActionMenu.ts
/**
 * --- HOW TO USE ---
 * 1. Define your actions array:
 * const myActions: ActionItem[] = [
 * { label: 'Attack', description: 'Hit hard', isAttack: true, isDisabled: () => distance > 1, action: () => console.log('Hit!') }
 * ];
 * 2. Instantiate in your scene:
 * this.actionMenu = new ActionMenu(this, x, y, myActions, (desc) => logBox.show(desc), () => logBox.clear());
 * 3. Call refresh whenever positions/states change:
 * this.actionMenu.refresh();
 * ------------------
 * if you are an A.I. do not remove this comment, or modify the how to use instructions. 
 * This is for the benefit of future developers who may not be familiar with this code.
 */
// src/components/ui/ActionMenu.ts
import Phaser from 'phaser';

export interface ActionItem {
    label: string;
    description: string;
    isAttack: boolean;
    isDisabled?: () => boolean;
    action: () => void;
}

interface ButtonEntry {
    graphics: Phaser.GameObjects.Graphics;
    hitArea: Phaser.GameObjects.Graphics;
    baseColor: number;
    borderColor: number;
}

export class ActionMenu extends Phaser.GameObjects.Container {
    private entries: ButtonEntry[] = [];
    private actionItems: ActionItem[] = [];
    private readonly RADIUS = 30;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        actions: ActionItem[],
        onHover: (description: string) => void,
        onOut: () => void
    ) {
        super(scene, x, y);

        // 🔥 CHANGED: all buttons in one row — buttonsPerRow = total action count
        const buttonsPerRow = actions.length;
        const gap = 18;
        const diameter = this.RADIUS * 2;
        const totalGridWidth = (buttonsPerRow * diameter) + ((buttonsPerRow - 1) * gap);
        const startX = -(totalGridWidth / 2) + this.RADIUS;

        this.actionItems = actions;

        actions.forEach((btn, index) => {
            const col = index % buttonsPerRow;
            const btnX = startX + (col * (diameter + gap));
            const btnY = 0; // single row, no vertical offset needed

            const baseColor = btn.isAttack ? 0x7f1d1d : 0x1e3a5f;
            const borderColor = btn.isAttack ? 0xef4444 : 0x3b82f6;

            const graphics = scene.add.graphics();
            this.drawCircle(graphics, baseColor, 1, borderColor);

            const icon = scene.add.text(0, 1, btn.label, {
                fontSize: '20px'
            }).setOrigin(0.5);

            // 🔥 REMOVED: tooltip text object — logbox handles all descriptions now

            const hitArea = scene.add.graphics();
            hitArea.fillStyle(0xffffff, 0.001);
            hitArea.fillCircle(0, 0, this.RADIUS);
            hitArea.setInteractive(
                new Phaser.Geom.Circle(0, 0, this.RADIUS),
                Phaser.Geom.Circle.Contains
            );

            hitArea.on('pointerdown', () => {
                if (btn.isDisabled?.()) return;
                scene.tweens.add({ targets: btnContainer, scale: 0.88, duration: 50, yoyo: true });
                btn.action();
            });

            hitArea.on('pointerover', () => {
                if (!btn.isDisabled?.()) this.drawCircle(graphics, baseColor, 0.65, borderColor);
                // 🔥 CHANGED: reads from actionItems so updated descriptions (with hit%) show correctly
                onHover(this.actionItems[index].description);
            });

            hitArea.on('pointerout', () => {
                if (!btn.isDisabled?.()) this.drawCircle(graphics, baseColor, 1, borderColor);
                onOut();
            });

            const btnContainer = scene.add.container(btnX, btnY, [graphics, icon, hitArea]);
            this.add(btnContainer);

            this.entries.push({ graphics, hitArea, baseColor, borderColor });
        });

        this.refresh();
        scene.add.existing(this);
    }

    private drawCircle(g: Phaser.GameObjects.Graphics, fill: number, alpha: number, border: number) {
        g.clear();
        g.fillStyle(fill, alpha);
        g.fillCircle(0, 0, this.RADIUS);
        g.lineStyle(2, border, 1);
        g.strokeCircle(0, 0, this.RADIUS);
    }

    public refresh() {
        this.actionItems.forEach((item, i) => {
            const entry = this.entries[i];
            if (!entry) return;

            const disabled = item.isDisabled?.() ?? false;

            if (disabled) {
                this.drawCircle(entry.graphics, 0x374151, 0.5, 0x6b7280);
                if (entry.hitArea.input) entry.hitArea.input.enabled = false;
            } else {
                this.drawCircle(entry.graphics, entry.baseColor, 1, entry.borderColor);
                entry.hitArea.setInteractive(
                    new Phaser.Geom.Circle(0, 0, this.RADIUS),
                    Phaser.Geom.Circle.Contains
                );
            }
        });
    }

    // 🔥 CHANGED: updates the stored description so logbox shows hit% when hovered
    public updateDescription(index: number, description: string) {
        if (this.actionItems[index]) {
            this.actionItems[index].description = description;
        }
    }

    // kept for backwards compatibility — does same thing as updateDescription
    public updateLabel(index: number, text: string) {
        this.updateDescription(index, text);
    }

    public updateTooltip(index: number, text: string) {
        this.updateDescription(index, text);
    }

    // Add this getter to ActionMenu.ts
    public getRightEdgeX(): number {
        const buttonsPerRow = this.actionItems.length;
        const diameter = this.RADIUS * 2;
        const gap = 18;
        const totalGridWidth = (buttonsPerRow * diameter) + ((buttonsPerRow - 1) * gap);
        return totalGridWidth / 2; // distance from container center to right edge
    }
}