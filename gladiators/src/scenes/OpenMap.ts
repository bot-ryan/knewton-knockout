// scenes/OpenMap.ts
import Phaser from 'phaser';
import { SpireMapGenerator, type MapNode } from '../gameinit/MapGenerator';
// Import your Zustand store here

export class OpenMap extends Phaser.Scene {
    constructor() {
        super('OpenMap');
    }

    create() {
        // 1. Generate the Map (or load it if already generated for this run)
        // You should save this 'nodes' array to your store and localForage 
        // immediately after generation so it persists across browser reloads.
        const generator = new SpireMapGenerator();
        const nodes = generator.generate();

        // 2. Setup rendering constants
        const PADDING_X = 80; 
        const PADDING_Y = 100;
        const JITTER = 20;
        
        // Center the starting grid based on game width
        const startX = (this.scale.width / 2) - (3 * PADDING_X); 
        const startY = this.scale.height - 100;

        // 3. Pre-calculate visual coordinates for all nodes
        const visualNodes = nodes.map(node => ({
            ...node,
            vX: startX + (node.x * PADDING_X) + (Math.random() * JITTER),
            vY: startY - (node.y * PADDING_Y) - (Math.random() * JITTER)
        }));

        // 4. Draw Lines FIRST (so they stay in the background)
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x888888, 0.8); // 2px wide, gray, 80% opacity

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

        // 5. Draw Node Icons SECOND (on top of the lines)
        visualNodes.forEach(node => {
            const icon = this.add.text(node.vX, node.vY, node.type, { fontSize: '32px' })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.handleNodeClick(node);
                });

            // Optional: Add hover effects
            icon.on('pointerover', () => icon.setScale(1.2));
            icon.on('pointerout', () => icon.setScale(1.0));
        });
    }

    private handleNodeClick(node: MapNode) {
        console.log(`Navigating to node: ${node.id} of type ${node.type}`);
        // Logic to verify if the node is clickable based on current floor,
        // then update Zustand state, and transition to the Combat/Rest scene.
    }
}