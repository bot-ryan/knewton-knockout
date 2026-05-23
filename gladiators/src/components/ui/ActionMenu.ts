// src/components/ui/ActionMenu.ts
/**
 * --- HOW TO USE ---
 * 1. Define your actions array:
 * const myActions: ActionItem[] = [
 * { label: 'Attack', description: 'Hit hard', isAttack: true, action: () => console.log('Hit!') }
 * ];
 * * 2. Instantiate in your scene:
 * new ActionMenu(this, x, y, myActions, (desc) => logBox.show(desc), () => logBox.clear());
 * ------------------
 */
import Phaser from 'phaser';

export interface ActionItem {
    label: string;
    description: string;
    isAttack: boolean; // Tells the UI whether to color it red (combat) or blue (utility)
    action: () => void;
}

export class ActionMenu extends Phaser.GameObjects.Container {
    /**
     * Creates an interactive action menu grid.
     * * @param scene - The Phaser scene this menu belongs to.
     * @param x - The center X coordinate for the menu.
     * @param y - The center Y coordinate for the menu.
     * @param actions - An array of ActionItem objects to render.
     * @param onHover - Callback function triggered when a button is hovered (provides description).
     * @param onOut - Callback function triggered when a button is un-hovered.
     */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        actions: ActionItem[],
        onHover: (description: string) => void,
        onOut: () => void
    ) {
        super(scene, x, y);

        const buttonsPerRow = 4;
        const buttonWidth = 120;
        const buttonHeight = 36;
        const gapX = 16;
        const gapY = 12;

        // Calculate total grid width to perfectly center the buttons inside this container
        const totalGridWidth = (buttonsPerRow * buttonWidth) + ((buttonsPerRow - 1) * gapX);
        const startX = -(totalGridWidth / 2) + (buttonWidth / 2); 

        actions.forEach((btn, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;

            const btnX = startX + (col * (buttonWidth + gapX));
            const btnY = row * (buttonHeight + gapY);

            // Styling colors based on action type
            const btnColor = btn.isAttack ? '#dc2626' : '#2563eb';
            const hoverColor = btn.isAttack ? '#ef4444' : '#3b82f6';

            // Create the background and text
            const actionBtn = scene.add.text(btnX, btnY, btn.label, {
                backgroundColor: btnColor,
                padding: { x: 10, y: 8 },
                fontFamily: 'sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
                fixedWidth: buttonWidth
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

            // Interactions
            actionBtn.on('pointerdown', () => {
                // Add a little "click" bounce effect for game feel
                scene.tweens.add({
                    targets: actionBtn,
                    scale: 0.90,
                    duration: 50,
                    yoyo: true
                });
                btn.action();
            });

            actionBtn.on('pointerover', () => {
                actionBtn.setBackgroundColor(hoverColor);
                onHover(btn.description);
            });

            actionBtn.on('pointerout', () => {
                actionBtn.setBackgroundColor(btnColor);
                onOut();
            });

            this.add(actionBtn);
        });

        // Register container with the scene
        scene.add.existing(this);
    }
}