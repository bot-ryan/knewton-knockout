// scenes/OpenMap.ts
import Phaser from 'phaser';
import { SpireMapGenerator, type MapNode } from '../gameinit/MapGenerator';
import { SceneKeys } from '../data/SceneKeys';

// Import your global playerData to use as a fallback or verification
import { playerData, type PlayerData } from '../data/playerData';

export class OpenMap extends Phaser.Scene {
    private isDragging = false;
    private dragStartX = 0;
    private camStartX = 0;
    private activePlayer?: PlayerData; 

    constructor() {
        super(SceneKeys.OpenMap); // Clean up hardcoded string to use your SceneKeys enum
    }

    // 🔥 Added: Phaser's data receiver method
    init(data: { character?: PlayerData }) {
        if (data && data.character) {
            this.activePlayer = data.character;
        } else {
            // Fallback: If the scene is launched directly during testing without a payload,
            // fall back to whatever is currently sitting in the global playerData module.
            this.activePlayer = playerData;
        }

        // Verification check in your debug console
        console.log("--- Player Data Successfully Received ---");
        console.log(`Gladiator: ${this.activePlayer.name}`);
        console.log(`Stamina Pool: ${this.activePlayer.secondaryStats.stamina}`); // Verifying the new stat!
        console.log(`Health Pool: ${this.activePlayer.secondaryStats.hp}`);
    }

    create() {
        const generator = new SpireMapGenerator();
        const nodes = generator.generate();

        const PADDING_X = 140; 
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
            
            icon.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
                event.stopPropagation(); 
                console.log("Clicked node:", node.type);
                
                // When we start the Encounter Card or Combat system later, 
                // you can pass `this.activePlayer` right along with it!
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
            const diffX = pointer.x - this.dragStartX;
            this.cameras.main.scrollX = this.camStartX - diffX;
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // UI Header: Dynamic text displaying the active gladiator's name and stats
        this.add.text(20, 20, `Gladiator: ${this.activePlayer?.name} | STM: ${this.activePlayer?.secondaryStats.stamina}`, { 
            color: '#ffffff', 
            fontSize: '16px',
            fontFamily: 'Verdana',
            backgroundColor: '#141a2a',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setStroke('#22304c', 2);
    }
}