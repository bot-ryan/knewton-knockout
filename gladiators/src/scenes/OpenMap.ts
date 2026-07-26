// src/scenes/OpenMap.ts
import Phaser from 'phaser';
import { SpireMapGenerator } from '../gameinit/MapGenerator';
import { SceneKeys } from '../data/SceneKeys';
import { usePlayerStore, type PlayerData } from '../data/PlayerData';
import { useMapStore } from '../data/MapData';
import { StatChip } from '../components/ui/StatChip';
import { CharacterSheetPanel } from '../components/ui/CharacterSheetPanel';

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
        this.activePlayer = usePlayerStore.getState() as PlayerData;
    }

    create() {
        const { width, height } = this.scale;

        const PADDING_X = 140;
        const PADDING_Y = 90;
        const JITTER = 20;
        const startX = 150;
        const startY = (height / 2) - (3 * PADDING_Y);

        // --- STAT CHIPS ---
        const hpChip = new StatChip(
            this, 20, 20, 'hp',
            this.activePlayer?.secondaryStats.hp.current ?? 0,
            this.activePlayer?.secondaryStats.hp.max ?? 0
        ).setScrollFactor(0);

        const staminaChip = new StatChip(
            this, 130, 20, 'stamina',
            this.activePlayer?.secondaryStats.stamina.current ?? 0,
            this.activePlayer?.secondaryStats.stamina.max ?? 0
        ).setScrollFactor(0);

        const goldChip = new StatChip(
            this, 240, 20, 'gold',
            this.activePlayer?.gold ?? 0
        ).setScrollFactor(0);

        // --- MAP GENERATION ---
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

        const maxVX = Math.max(...visualNodes.map(n => n.vX)) + 200;
        this.cameras.main.setBounds(0, 0, maxVX, height);

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

        visualNodes.forEach(node => {
            const isSelectable = this.isNodeSelectable(node, visualNodes, currentNodeId);
            const isCurrentNode = node.id === currentNodeId;
            const iconAlpha = isSelectable || isCurrentNode ? 1 : 0.3;

            const icon = this.add.text(node.vX, node.vY, String(node.type), { fontSize: '36px' })
                .setOrigin(0.5)
                .setAlpha(iconAlpha);

            if (isCurrentNode) {
                this.add.text(node.vX, node.vY - 35, 'YOU', {
                    fontSize: '14px', fontStyle: 'bold', color: '#fbbf24',
                    backgroundColor: '#000000', padding: { x: 4, y: 2 }
                }).setOrigin(0.5);
            }

            if (isSelectable) {
                icon.setInteractive({ useHandCursor: true });
                icon.on('pointerover', () => icon.setScale(1.2));
                icon.on('pointerout',  () => icon.setScale(1.0));
                icon.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation();
                    this.handleNodeEncounter(node);
                });
            }
        });

        // --- CAMERA DRAG ---
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.camStartX = this.cameras.main.scrollX;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;
            this.cameras.main.scrollX = this.camStartX - (pointer.x - this.dragStartX);
        });

        this.input.on('pointerup', () => { this.isDragging = false; });

        // 🔥 NEW: Character sheet button — bottom right, fixed to screen
        const charBtn = this.add.container(width - 50, height - 50);

        const btnCircle = this.add.graphics();
        btnCircle.fillStyle(0x1e3a5f, 1);
        btnCircle.fillCircle(0, 0, 28);
        btnCircle.lineStyle(2, 0x3b82f6, 1);
        btnCircle.strokeCircle(0, 0, 28);

        const btnIcon = this.add.text(0, 0, '🧍', { fontSize: '20px' }).setOrigin(0.5);

        // Transparent hit area for reliable click detection
        const btnHit = this.add.graphics();
        btnHit.fillStyle(0xffffff, 0.001);
        btnHit.fillCircle(0, 0, 28);
        btnHit.setInteractive(
            new Phaser.Geom.Circle(0, 0, 28),
            Phaser.Geom.Circle.Contains
        );

        btnHit.on('pointerover', () => {
            btnCircle.clear();
            btnCircle.fillStyle(0x2a4a7f, 1);
            btnCircle.fillCircle(0, 0, 28);
            btnCircle.lineStyle(2, 0x60a5fa, 1);
            btnCircle.strokeCircle(0, 0, 28);
        });

        btnHit.on('pointerout', () => {
            btnCircle.clear();
            btnCircle.fillStyle(0x1e3a5f, 1);
            btnCircle.fillCircle(0, 0, 28);
            btnCircle.lineStyle(2, 0x3b82f6, 1);
            btnCircle.strokeCircle(0, 0, 28);
        });

        btnHit.on('pointerdown', () => CharacterSheetPanel.open(this, this.activePlayer!));
        

        charBtn.add([btnCircle, btnIcon, btnHit]);
        charBtn.setScrollFactor(0).setDepth(10); // above map nodes
    }

    

    // --- HELPERS for building panel content ---

    private addSectionHeader(
        container: Phaser.GameObjects.Container,
        label: string,
        x: number,
        y: number
    ) {
        const header = this.add.text(x, y, label, {
            fontFamily: 'Verdana',
            fontSize: '11px',
            color: '#64748b',
            fontStyle: 'bold',
            letterSpacing: 2
        });
        container.add(header);
    }

    private addStatRow(
        container: Phaser.GameObjects.Container,
        label: string,
        value: string,
        x: number,
        y: number,
        valueColor: string = '#e2e8f0'
    ) {
        const labelText = this.add.text(x, y, label, {
            fontFamily: 'Verdana',
            fontSize: '13px',
            color: '#94a3b8'
        });

        const valueText = this.add.text(x + 200, y, value, {
            fontFamily: 'Verdana',
            fontSize: '13px',
            color: valueColor,
            fontStyle: 'bold'
        }).setOrigin(1, 0); // right-aligned so values line up cleanly

        container.add([labelText, valueText]);
    }

    private isNodeSelectable(node: any, allNodes: any[], currentNodeId: string | null): boolean {
        if (!currentNodeId) return node.x === 0;
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
            this.scene.start('CombatScene', {
                character: this.activePlayer,
                enemyTemplate: chosenEnemy
            });
        });
    }
}