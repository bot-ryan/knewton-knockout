// scenes/OpenMap.ts
import Phaser from 'phaser';
import { SpireMapGenerator, type MapNode } from '../gameinit/MapGenerator';
// Import your Zustand store here

// scenes/OpenMap.ts

export class OpenMap extends Phaser.Scene {
    private isDragging = false;
    private dragStartX = 0;
    private camStartX = 0;

    constructor() {
        super('OpenMap');
    }

    create() {
        const generator = new SpireMapGenerator();
        const nodes = generator.generate();

        const PADDING_X = 140; // Spacing it out more for better horizontal feel
        const PADDING_Y = 90;
        const JITTER = 20;
        const startX = 150;
        const startY = (this.scale.height / 2) - (3 * PADDING_Y);

        // 1. Calculate visual positions
        const visualNodes = nodes.map(node => ({
            ...node,
            vX: startX + (node.x * PADDING_X) + (Math.random() * JITTER),
            vY: startY + (node.y * PADDING_Y) + (Math.random() * JITTER)
        }));

        // 2. Determine Map Width for Camera Bounds
        // We find the furthest node (the Boss) to know where to stop scrolling
        const maxVX = Math.max(...visualNodes.map(n => n.vX)) + 200; 
        this.cameras.main.setBounds(0, 0, maxVX, this.scale.height);

        // 3. Draw Lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x444444, 0.8);
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

     // 4. Draw Nodes
visualNodes.forEach(node => {
    const icon = this.add.text(node.vX, node.vY, node.type, { fontSize: '36px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
    
    // We add 'event' as the second parameter here
    icon.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
        // This is the Phaser way to stop the scene from also reacting to this click
        event.stopPropagation(); 
        
        console.log("Clicked node:", node.type);
        // Add your logic to enter combat/shop here
    });
});

        // 5. CAMERA DRAG LOGIC
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.camStartX = this.cameras.main.scrollX;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;

            // Calculate how far the mouse moved
            const diffX = pointer.x - this.dragStartX;
            
            // Move the camera in the opposite direction of the drag
            // (Drag left to see right)
            this.cameras.main.scrollX = this.camStartX - diffX;
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Optional: Add a text instruction that follows the camera
        this.add.text(20, 20, "Drag to explore the map", { color: '#ffffff', fontSize: '16px' })
            .setScrollFactor(0); // This makes the text stay fixed on the screen
    }
}