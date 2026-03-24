// scenes/OpenMap.ts
import Phaser from 'phaser';
import { SpireMapGenerator, type MapNode } from '../gameinit/MapGenerator';
// Import your Zustand store here

export class OpenMap extends Phaser.Scene {
    constructor() {
        super('OpenMap');
    }

    create() {
        // 1. Generate (returns updated node structure)
        const generator = new SpireMapGenerator();
        const nodes = generator.generate();

        // 2. Setup rendering constants (Increased PADDING_X as there are more steps)
        const PADDING_X = 120; // Progress distance (Left -> Right)
        const PADDING_Y = 80;  // Spread distance (Up -> Down)
        const JITTER = 20;
        
        // Start X on the left, center Y vertically
        const startX = 100; 
        const startY = (this.scale.height / 2) - (3 * PADDING_Y);

        // 3. Pre-calculate visual coordinates (Swapped visual mapping)
        const visualNodes = nodes.map(node => ({
            ...node,
            // X position is now (MapProgress * Padding) + Start
            vX: startX + (node.x * PADDING_X) + (Math.random() * JITTER),
            // Y position is now (SpreadIndex * Padding) + Start
            vY: startY + (node.y * PADDING_Y) + (Math.random() * JITTER)
        }));

        // 4. Draw Lines FIRST (Same code as before, just uses pre-calculated swapped coords)
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x888888, 0.8);

        visualNodes.forEach(node => {
            node.nextNodes.forEach(nextId => {
                const nextNode = visualNodes.find(n => n.id === nextId);
                if (nextNode) {
                    graphics.moveTo(node.vX, node.vY);
                    graphics.lineTo(nextNode.vX, nextNode.vY);
                }
            });
        });
        graphics.strokePath();

        // 5. Draw Node Icons SECOND (Same code as before)
        visualNodes.forEach(node => {
            this.add.text(node.vX, node.vY, node.type, { fontSize: '32px' })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
        });
    }
}