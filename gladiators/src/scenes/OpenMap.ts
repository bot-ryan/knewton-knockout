// src/scenes/OpenMap.ts
import Phaser from 'phaser';
import { SpireMapGenerator, type MapNode } from '../gameinit/MapGenerator';
import { SceneKeys } from '../data/SceneKeys';
import { playerData, type PlayerData } from '../data/playerData';

// 🔥 FIX 1: Import your structured enemy pools and templates
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

    init(data: { character?: PlayerData }) {
        if (data && data.character) {
            this.activePlayer = data.character;
        } else {
            this.activePlayer = playerData;
        }

        console.log("--- Player Data Successfully Received ---");
        console.log(`Gladiator: ${this.activePlayer.name}`);
        console.log(`Stamina Pool: ${this.activePlayer.secondaryStats.stamina.current}/${this.activePlayer.secondaryStats.stamina.max}`);
        console.log(`Health Pool: ${this.activePlayer.secondaryStats.hp.current}/${this.activePlayer.secondaryStats.hp.max}`);
        console.log(`Mana Pool: ${this.activePlayer.secondaryStats.mp.current}/${this.activePlayer.secondaryStats.mp.max}`);
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
                
                // 🔥 FIX 2: Trigger our dynamic encounter router!
                this.handleNodeEncounter(node);
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

        // UI Header
        this.add.text(20, 20, `${this.activePlayer?.name} | HEALTH: ${this.activePlayer?.secondaryStats.hp.current}/${this.activePlayer?.secondaryStats.hp.max}`, { 
            color: '#ffffff', 
            fontSize: '16px',
            fontFamily: 'Verdana',
            backgroundColor: '#141a2a',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setStroke('#22304c', 2);
    }

    /**
     * 🔥 FIX 3: Dynamic Node Router
     * Determines what type of encounter pool to roll, selects the random enemy,
     * and packages the payload into the CombatScene launch sequence.
     */
    private handleNodeEncounter(node: any) {
        let selectedPool: EnemyTemplate[] = [];

        // Normalize your node type identifiers (Supports emojis or explicit text strings)
        const nodeType = node.type.toUpperCase();

        if (nodeType.includes('⚔️') || nodeType.includes('COMBAT') || nodeType.includes('BEGINNER')) {
            selectedPool = BEGINNER_ENEMY_POOL;
        } else if (nodeType.includes('STANDARD')) {
            selectedPool = STANDARD_ENEMY_POOL;
        } else if (nodeType.includes('💀') || nodeType.includes('ELITE')) {
            selectedPool = ELITE_ENEMY_POOL;
        } else if (nodeType.includes('👑') || nodeType.includes('BOSS')) {
            selectedPool = BOSS_ENEMY_POOL;
        } else {
            // Safe fallback just in case it's an unrecognized node type (like mystery events)
            console.warn(`Unmapped node type: ${node.type}. Defaulting to Beginner.`);
            selectedPool = BEGINNER_ENEMY_POOL;
        }

        // Pull a random gladiator out of our chosen bracket pool
        const chosenEnemy = Phaser.Utils.Array.GetRandom(selectedPool);
        console.log(`Encounter Generated! Battle: ${chosenEnemy.displayName}`);

        // Lock camera and flash-fade out into battle arena
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Note: If you added a Combat registry value inside SceneKeys enum,
            // replace 'CombatScene' below with SceneKeys.Combat!
            this.scene.start('CombatScene', {
                character: this.activePlayer,
                enemyTemplate: chosenEnemy
            });
        });
    }
}