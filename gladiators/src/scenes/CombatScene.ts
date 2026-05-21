// src/scenes/CombatScene.ts
import Phaser from 'phaser';
import { type PlayerData } from '../data/playerData';
import { type EnemyTemplate } from '../data/Enemy/EnemyArchetypes';
import { generateEnemyIdentity, type EnemyIdentity } from '../data/Enemy/EnemyIdentity';

interface CombatPayload {
    character: PlayerData;
    enemyTemplate: EnemyTemplate;
}

export default class CombatScene extends Phaser.Scene {
    // State Data
    private playerState!: PlayerData;
    private enemyTemplate!: EnemyTemplate;
    private enemyIdentity!: EnemyIdentity;

    // Current Battle Mutables
    private currentEnemyHp = 0;
    private currentEnemyStamina = 0;

    // UI Text GameObjects
    private titleText!: Phaser.GameObjects.Text;
    private playerNameText!: Phaser.GameObjects.Text;
    private playerHpText!: Phaser.GameObjects.Text;
    private playerStaminaText!: Phaser.GameObjects.Text;

    private enemyNameText!: Phaser.GameObjects.Text;
    private enemyHpText!: Phaser.GameObjects.Text;
    private enemyStaminaText!: Phaser.GameObjects.Text;
    private enemyDescText!: Phaser.GameObjects.Text;

    private combatLogText!: Phaser.GameObjects.Text;

    // Visual Art Placeholders (Shapes)
    private playerGraphic!: Phaser.GameObjects.Graphics;
    private enemyGraphic!: Phaser.GameObjects.Graphics;

    constructor() {
        // Change to your SceneKeys enum value if registered there
        super('CombatScene');
    }

    /**
     * 📥 Captures data passed from OpenMap.ts
     */
    init(data: CombatPayload) {
        if (!data || !data.enemyTemplate || !data.character) {
            console.warn("CombatScene launched directly without setup payload. Returning to Map.");
            this.scene.start('OpenMap');
            return;
        }

        this.playerState = data.character;
        this.enemyTemplate = data.enemyTemplate;

        // Automatically resolve custom naming mechanics & curated elite profiles
        this.enemyIdentity = generateEnemyIdentity(this.enemyTemplate);

        // Assign core starting combat values from asset templates
        this.currentEnemyHp = this.enemyTemplate.baseHp;
        this.currentEnemyStamina = this.enemyTemplate.baseStamina;
    }

    preload() {
        // Preload layout overlays or specialized match audio files if needed later
    }

    create() {
        const { width, height } = this.scale;

        // Smooth camera entry transition
        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#0d0f1d');

        // --- BACKGROUND DECORATION ---
        const arenaFloor = this.add.graphics();
        arenaFloor.fillStyle(0x1a1d36, 1);
        arenaFloor.fillRect(0, height * 0.65, width, height * 0.35);
        arenaFloor.lineStyle(4, 0x272c4e, 1);
        arenaFloor.lineBetween(0, height * 0.65, width, height * 0.65);

        // Header Title Arena Label
        this.titleText = this.add.text(width / 2, 35, `ARENA TIER: ${this.enemyTemplate.tier}`, {
            fontFamily: 'Verdana',
            fontSize: '18px',
            color: '#7e87a2',
            letterSpacing: 2
        }).setOrigin(0.5);

        // ==========================================
        // 🛡️ LEFT SIDE: PLAYER HUD & SPRITE PLACEHOLDER
        // ==========================================
        const playerX = width * 0.25;
        
        // Player Stickman placeholder (Simple Capsule representation)
        this.playerGraphic = this.add.graphics();
        this.playerGraphic.fillStyle(0x3b82f6, 1); // Dedicated Blue Team Color
        this.playerGraphic.fillRoundedRect(playerX - 25, height * 0.4, 50, 120, 16);

        // Player Text Labels
        this.playerNameText = this.add.text(playerX, height * 0.22, this.playerState.name.toUpperCase(), {
            fontFamily: 'sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.playerHpText = this.add.text(playerX, height * 0.27, `HP: ${this.playerState.secondaryStats.hp.current} / ${this.playerState.secondaryStats.hp.max}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ef4444'
        }).setOrigin(0.5);

        this.playerStaminaText = this.add.text(playerX, height * 0.31, `STAMINA: ${this.playerState.secondaryStats.stamina.current} / ${this.playerState.secondaryStats.stamina.max}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#10b981'
        }).setOrigin(0.5);


        // ==========================================
        // 👹 RIGHT SIDE: ENEMY HUD & SPRITE PLACEHOLDER
        // ==========================================
        const enemyX = width * 0.75;

        // Enemy Stickman placeholder dynamically fueled by your generation script
        this.enemyGraphic = this.add.graphics();
        this.enemyGraphic.fillStyle(this.enemyIdentity.skinColor, 1); // 💡 Renders the generated skin color live!
        this.enemyGraphic.fillRoundedRect(enemyX - 25, height * 0.4, 50, 120, 16);

        // Enemy Text Labels
        this.enemyNameText = this.add.text(enemyX, height * 0.22, this.enemyIdentity.name, {
            fontFamily: 'sans-serif',
            fontSize: '22px',
            color: '#ffb0b0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.enemyHpText = this.add.text(enemyX, height * 0.27, `HP: ${this.currentEnemyHp} / ${this.enemyTemplate.baseHp}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ef4444'
        }).setOrigin(0.5);

        this.enemyStaminaText = this.add.text(enemyX, height * 0.31, `STAMINA: ${this.currentEnemyStamina} / ${this.enemyTemplate.baseStamina}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#10b981'
        }).setOrigin(0.5);

        // Subtitle flavor text layout
        this.enemyDescText = this.add.text(enemyX, height * 0.36, `"${this.enemyTemplate.description}"`, {
            fontFamily: 'sans-serif',
            fontSize: '13px',
            color: '#9ca3af',
            fontStyle: 'italic',
            wordWrap: { width: 260, useAdvancedWrap: true }
        }).setOrigin(0.5);


        // ==========================================
        // 📜 BOTTOM SIDE: COMBAT ACTION LOGGER
        // ==========================================
        const logBox = this.add.graphics();
        logBox.fillStyle(0x07080d, 0.85);
        logBox.fillRoundedRect(40, height - 110, width - 80, 80, 8);
        logBox.lineStyle(2, 0x22253a, 1);
        logBox.strokeRoundedRect(40, height - 110, width - 80, 80, 8);

        this.combatLogText = this.add.text(60, height - 95, `An encounter begins! You face ${this.enemyIdentity.name} (${this.enemyTemplate.displayName}).`, {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#cbd5e1',
            wordWrap: { width: width - 120 }
        });

        // --- PLACEHOLDER INTERACTIVE ACTION CONTROLS ---
        this.createDebugActionButtons(width, height);
    }

    /**
     * 🛠️ Generates basic actions to let you easily simulate damage/exits during development
     */
    private createDebugActionButtons(width: number, height: number) {
        // Strike Action Button
        const strikeBtn = this.add.text(width * 0.35, height - 160, '⚔️ STRIKE', {
            backgroundColor: '#ef4444',
            padding: { x: 14, y: 8 },
            fontFamily: 'sans-serif',
            fontSize: '14px',
            color: '#ffffff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.executeAction('STRIKE'));

        // Retreat Button to return safely back to the map view
        const fleeBtn = this.add.text(width * 0.65, height - 160, '🏳️ RETREAT', {
            backgroundColor: '#4b5563',
            padding: { x: 14, y: 8 },
            fontFamily: 'sans-serif',
            fontSize: '14px',
            color: '#ffffff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.executeAction('RETREAT'));
    }

    /**
     * ⚙️ Process Actions
     */
    private executeAction(type: 'STRIKE' | 'RETREAT') {
        if (type === 'RETREAT') {
            this.combatLogText.setText("Fleeing match arena...");
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('OpenMap');
            });
            return;
        }

        if (type === 'STRIKE') {
            // Apply randomized calculation damage simulation
            const damage = Math.floor(Math.random() * 5) + 3;
            this.currentEnemyHp = Math.max(0, this.currentEnemyHp - damage);
            
            // Re-render updated state
            this.enemyHpText.setText(`HP: ${this.currentEnemyHp} / ${this.enemyTemplate.baseHp}`);
            this.combatLogText.setText(`You strike the opponent dealing ${damage} damage!`);

            // Flash visual cue feedback on target hit
            this.tweens.add({
                targets: this.enemyGraphic,
                alpha: 0.3,
                yoyo: true,
                duration: 60,
                repeat: 1
            });

            if (this.currentEnemyHp <= 0) {
                this.combatLogText.setText(`Victory! ${this.enemyIdentity.name} has been knocked out! Leaving match arena...`);
                this.time.delayedCall(1500, () => {
                    this.cameras.main.fadeOut(250, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start('OpenMap');
                    });
                });
            }
        }
    }
}