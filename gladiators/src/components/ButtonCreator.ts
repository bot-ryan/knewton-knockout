/**
 * ButtonCreator.ts
 * * A centralized utility class for generating consistent UI components across Knewton Knockout.
 * This class handles the instantiation of interactive Phaser Containers, including:
 * - Square and Round icon buttons
 * - Transparent buttons with built-in tooltip logic
 * - Global button state management (Enabled/Disabled)
 * * Usage:
 * Call static methods directly: ButtonCreator.makeIconButton(...)
 * * Note: Interactive elements are stored in a custom 'clickTarget' property 
 * on the returned Containers to ensure input toggling works correctly.
 */


import Phaser from 'phaser';

export class ButtonCreator {
    static makeTransparentIconButton(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        glyph: string, 
        fontSize: string, 
        tooltip: Phaser.GameObjects.Text, 
        onClick: () => void
    ) {
        const txt = scene.add.text(0, 0, glyph, { fontSize, padding: { top: 10, bottom: 10, left: 5, right: 5 } }).setOrigin(0.5);
        const hitArea = scene.add.zone(0, 0, 50, 50).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
        
        hitArea.on('pointerover', () => { 
            scene.tweens.add({ targets: tooltip, alpha: 1, duration: 150 }); 
            scene.tweens.add({ targets: txt, scale: 1.2, duration: 100 }); 
        });
        
        hitArea.on('pointerout', () => { 
            scene.tweens.add({ targets: tooltip, alpha: 0, duration: 150 }); 
            scene.tweens.add({ targets: txt, scale: 1, duration: 100 }); 
        });
        
        hitArea.on('pointermove', (p: Phaser.Input.Pointer) => { 
            tooltip.setPosition(p.x + 15, p.y + 15); 
        });
        
        const c = scene.add.container(x, y, [hitArea, txt]).setSize(50, 50);
        (c as any).clickTarget = hitArea;
        return c;
    }

    static makeStandardButton(
        scene: Phaser.Scene, 
        text: string, 
        width: number, 
        height: number, 
        onClick: () => void
    ) {
        const bg = scene.add.rectangle(0, 0, width, height, 0x333333)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.9);
            
        const label = scene.add.text(0, 0, text, { 
            fontSize: '20px', 
            color: '#ffffff' 
        }).setOrigin(0.5);

        const container = scene.add.container(0, 0, [bg, label]);

        // Standard Hover Logic
        bg.on('pointerover', () => bg.setFillStyle(0x555555));
        bg.on('pointerout', () => bg.setFillStyle(0x333333));
        bg.on('pointerdown', onClick);

        // Helper function encapsulated within the factory to handle state
        const setEnabled = (enabled: boolean) => {
            bg.setAlpha(enabled ? 0.9 : 0.4);
            if (enabled) {
                bg.setInteractive({ useHandCursor: true });
            } else {
                bg.disableInteractive();
            }
        };

        return { container, setEnabled, bgWidth: width, bgHeight: height };
    }

    static makeIconButton(scene: Phaser.Scene, x: number, y: number, glyph: string, onClick: () => void) {
        const bg = scene.add.rectangle(0, 0, 28, 28, 0x1c2740).setStrokeStyle(1, 0x2a3a5f).setOrigin(0).setInteractive().on('pointerdown', onClick);
        const txt = scene.add.text(14, 14, glyph, { fontSize: '16px' }).setOrigin(0.5);
        const c = scene.add.container(x, y, [bg, txt]).setSize(28, 28);
        (c as any).clickTarget = bg;
        return c;
    }

    static makeRoundButton(scene: Phaser.Scene, x: number, y: number, r: number, color: number, glyph: string, onClick: () => void) {
        const g = scene.add.graphics().fillStyle(color).fillCircle(0,0,r).lineStyle(2,0xffffff,0.3).strokeCircle(0,0,r)
            .setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains).on('pointerdown', onClick);
        const t = scene.add.text(0,0,glyph, { fontSize: '28px', padding: { top: 10, bottom: 5} }).setOrigin(0.5);
        const c = scene.add.container(x, y, [g, t]).setSize(r*2, r*2);
        (c as any).clickTarget = g;
        return c;
    }

    static setButtonEnabled(c: Phaser.GameObjects.Container, e: boolean) {
        c.setAlpha(e ? 1 : 0.3); 
        const target = (c as any).clickTarget || c;
        if (target.input) target.input.enabled = e;
    }
}