// src/scenes/OpenMap.ts
import Phaser from 'phaser';
import { SpireMapGenerator } from '../gameinit/MapGenerator';
import { SceneKeys } from '../data/SceneKeys';
import { usePlayerStore, type PlayerData } from '../data/PlayerData';
import { useMapStore } from '../data/MapData';

import { 
    BEGINNER_ENEMY_POOL, 
    STANDARD_ENEMY_POOL, 
    ELITE_ENEMY_POOL, 
    BOSS_ENEMY_POOL, 
    type EnemyTemplate 
} from '../data/Enemy/EnemyArchetypes';

export class OpenMap extends Phaser.Scene {
    private isDragging = false;
    private dragStartX = 0;
    private camStartX = 0;
    private activePlayer?: PlayerData; 

    constructor() {
        super(SceneKeys.OpenMap);
    }

    init() {
        // 🔥 FIX 2: Zustand makes scene-to-scene data passing obsolete!
        // We just grab the freshest snapshot of the player directly from the store.
        this.activePlayer = usePlayerStore.getState() as PlayerData;
    }

    create() {
        const PADDING_X = 140; 
        const PADDING_Y = 90;
        const JITTER = 20;
        const startX = 150;
        const startY = (this.scale.height / 2) - (3 * PADDING_Y);

        if (useMapStore.getState().nodes.length === 0) {
            const generator = new SpireMapGenerator();
            const rawNodes = generator.generate();
            
            const nodesWithVisuals = rawNodes.map(node => ({
                ...node,
                vX: startX + (node.x * PADDING_X) + (Math.random() * JITTER),
                vY: startY + (node.y * PADDING_Y) + (Math.random() * JITTER)
            }));
            
            useMapStore.getState().setMapData(nodesWithVisuals);
        }

        const { nodes: visualNodes, currentNodeId } = useMapStore.getState();

        // Determine Map Width for Camera Bounds
        const maxVX = Math.max(...visualNodes.map(n => n.vX)) + 200; 
        this.cameras.main.setBounds(0, 0, maxVX, this.scale.height);

        // Draw Lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x444444, 0.8);
        
        visualNodes.forEach(node => {
            node.nextNodes.forEach((nextId: string) => {
                const nextNode = visualNodes.find(n => n.id === nextId);
                if (nextNode) {
                    graphics.moveTo(node.vX, node.vY);
                    graphics.lineTo(nextNode.vX, nextNode.vY);
                }
            });
        });
        graphics.strokePath();

        // Draw Nodes & Apply Path Locking
        visualNodes.forEach(node => {
            const isSelectable = this.isNodeSelectable(node, visualNodes, currentNodeId);
            const isCurrentNode = node.id === currentNodeId;
            
            const iconAlpha = isSelectable || isCurrentNode ? 1 : 0.3;

            const icon = this.add.text(node.vX, node.vY, String(node.type), { fontSize: '36px' })
                .setOrigin(0.5)
                .setAlpha(iconAlpha);
            
            if (isCurrentNode) {
                this.add.text(node.vX, node.vY - 35, 'YOU', { 
                    fontSize: '14px', fontStyle: 'bold', color: '#fbbf24', backgroundColor: '#000000', padding: {x: 4, y: 2}
                }).setOrigin(0.5);
            }

            if (isSelectable) {
                icon.setInteractive({ useHandCursor: true });
                
                icon.on('pointerover', () => icon.setScale(1.2));
                icon.on('pointerout', () => icon.setScale(1.0));

                icon.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation(); 
                    this.handleNodeEncounter(node);
                });
            }
        });

        // CAMERA DRAG LOGIC
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

        // UI Header
        this.add.text(20, 20, `${this.activePlayer?.name} | HEALTH: ${this.activePlayer?.secondaryStats.hp.current}/${this.activePlayer?.secondaryStats.hp.max}`, { 
            color: '#ffffff', 
            fontSize: '16px',
            fontFamily: 'Verdana',
            backgroundColor: '#141a2a',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setStroke('#22304c', 2);
    }

    private isNodeSelectable(node: any, allNodes: any[], currentNodeId: string | null): boolean {
        if (!currentNodeId) {
            return node.x === 0;
        }

        const currentNode = allNodes.find((n: any) => n.id === currentNodeId);
        return currentNode ? currentNode.nextNodes.includes(node.id) : false;
    }

    private handleNodeEncounter(node: any) {
        useMapStore.getState().setCurrentNode(node.id);

        let selectedPool: EnemyTemplate[] = [];
        const nodeType = String(node.type).toUpperCase();

        if (nodeType.includes('⚔️') || nodeType.includes('COMBAT') || nodeType.includes('BEGINNER')) {
            selectedPool = BEGINNER_ENEMY_POOL;
        } else if (nodeType.includes('STANDARD')) {
            selectedPool = STANDARD_ENEMY_POOL;
        } else if (nodeType.includes('💀') || nodeType.includes('ELITE')) {
            selectedPool = ELITE_ENEMY_POOL;
        } else if (nodeType.includes('👑') || nodeType.includes('BOSS')) {
            selectedPool = BOSS_ENEMY_POOL;
        } else {
            console.warn(`Unmapped node type: ${node.type}. Defaulting to Beginner.`);
            selectedPool = BEGINNER_ENEMY_POOL;
        }

        const chosenEnemy = Phaser.Utils.Array.GetRandom(selectedPool);

        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // 🔥 Note: We are still passing character data here so we don't break your CombatScene,
            // but eventually, CombatScene should pull from Zustand too!
            this.scene.start('CombatScene', {
                character: this.activePlayer,
                enemyTemplate: chosenEnemy
            });
        });
    }
}