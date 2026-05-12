/**
 * ColorPicker.ts
 * A reusable UI component that allows users to select a color from a wheel texture.
 * * Requirements: 
 * - Needs a 'colorWheel' image loaded in the scene's preload.
 */

import Phaser from 'phaser';
export class ColorPicker {
    private container: Phaser.GameObjects.Container;
    private selector: Phaser.GameObjects.Arc;

    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        size: number, 
        onColorSelect: (color: number) => void, 
        parent?: Phaser.GameObjects.Container
    ) {
        // Create the wheel image
        const wheel = scene.add.image(0, 0, 'colorWheel')
            .setDisplaySize(size, size)
            .setInteractive();

        // Create the visual ring that shows where you clicked
        this.selector = scene.add.arc(0, 0, 6, 0, 360, false, 0xffffff, 0)
            .setStrokeStyle(2, 0xffffff);

        // Group them into a container
        this.container = scene.add.container(x + size / 2, y + size / 2, [wheel, this.selector]);

        if (parent) {
            parent.add(this.container);
        }

        const handleInput = (p: Phaser.Input.Pointer) => {
            const lp = this.container.getLocalPoint(p.x, p.y);
            const src = wheel.texture.source[0];
            
            // Map the local click coordinates to the texture's actual pixel coordinates
            const tx = ((lp.x + size / 2) / size) * src.width;
            const ty = ((lp.y + size / 2) / size) * src.height;
            
            const col = scene.textures.getPixel(tx, ty, 'colorWheel');

            // Only select color if the pixel isn't transparent (inside the wheel)
            if (col && (col as any).alpha > 0) {
                this.selector.setPosition(lp.x, lp.y);
                const colorHex = Phaser.Display.Color.GetColor(
                    (col as any).red, 
                    (col as any).green, 
                    (col as any).blue
                );
                onColorSelect(colorHex);
            }
        };

        wheel.on('pointerdown', handleInput);
        wheel.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown) handleInput(p);
        });
    }

    /**
     * Optional: Moves the selector ring to a specific position if you
     * need to set the color programmatically (e.g., on Reset).
     */
    public setSelectorPosition(x: number, y: number) {
        this.selector.setPosition(x, y);
    }
}