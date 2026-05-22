// src/scenes/CombatScene.ts
import Phaser from 'phaser';
import { Stickman } from '../components/Stickman';
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
    private currentEnemyMp = 0;
    private currentEnemyStamina = 0;

    // UI Text & Graphics
    private titleText!: Phaser.GameObjects.Text;
    private combatLogText!: Phaser.GameObjects.Text;
    
    // Storing bars and changing texts so we can update them on damage/spellcast
    private enemyHpBar!: Phaser.GameObjects.Graphics;
    private enemyHpText!: Phaser.GameObjects.Text; // 🛠️ ADDED: Class property to track live text update
    
    private enemyUIX = 0;
    private enemyUIY = 40;
    private barWidth = 200;
    private barHeight = 16;

    // Sprites
    private playerStickman!: Stickman;
    private enemyGraphic!: Phaser.GameObjects.Graphics;

    constructor() {
        super('CombatScene');
    }

    init(data: CombatPayload) {
        if (!data || !data.enemyTemplate || !data.character) {
            console.warn("CombatScene launched directly without setup payload. Returning to Map.");
            this.scene.start('OpenMap');
            return;
        }

        this.playerState = data.character;
        this.enemyTemplate = data.enemyTemplate;
        this.enemyIdentity = generateEnemyIdentity(this.enemyTemplate);

        this.currentEnemyHp = this.enemyTemplate.baseHp;
        this.currentEnemyMp = (this.enemyTemplate as any).baseMp || 0; 
        this.currentEnemyStamina = this.enemyTemplate.baseStamina;
    }

    create() {
        const { width, height } = this.scale;

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
        // 🛡️ SPRITES (Centered left/right)
        // ==========================================
        const playerX = width * 0.25;
        const enemyX = width * 0.75;

        this.playerStickman = new Stickman(
            this,
            playerX,
            height * 0.52, 
            this.playerState.appearance.skinColor,
            this.playerState.appearance.expression
        );

        this.enemyGraphic = this.add.graphics();
        this.enemyGraphic.fillStyle(this.enemyIdentity.skinColor, 1); 
        this.enemyGraphic.fillRoundedRect(enemyX - 25, height * 0.4, 50, 120, 16);

        // ==========================================
        // 📊 UI BARS SETUP
        // ==========================================
        this.createPlayerUI();
        this.createEnemyUI(width);

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

        this.createDebugActionButtons(width, height);
    }

    /**
     * 🟢 Helper Method: Draws a uniform stat bar with a background
     */
    private drawStatBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, percentage: number, color: number) {
        graphics.clear();
        
        // Draw Background (Empty Bar)
        graphics.fillStyle(0x222222, 1);
        graphics.fillRect(x, y, width, height);
        
        // Draw Foreground (Current Stat)
        const clampedPercent = Math.max(0, Math.min(1, percentage)); 
        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, width * clampedPercent, height);

        // Draw Border
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x, y, width, height);
    }

    /**
     * 🛡️ Creates the Player's Top-Left UI Block with Text Labels
     */
    private createPlayerUI() {
        const startX = 40;
        const startY = 40;
        const gap = 24;

        // Name
        this.add.text(startX, startY, this.playerState.name.toUpperCase(), {
            fontFamily: 'sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        const hpBar = this.add.graphics();
        const mpBar = this.add.graphics();
        const staminaBar = this.add.graphics();

        const hp = this.playerState.secondaryStats.hp;
        const mp = this.playerState.secondaryStats.mp;
        const stam = this.playerState.secondaryStats.stamina;

        const hpPercent = hp.max > 0 ? hp.current / hp.max : 0;
        const mpPercent = mp.max > 0 ? mp.current / mp.max : 0;
        const staminaPercent = stam.max > 0 ? stam.current / stam.max : 0;

        // 1. Draw Bars Graphics First
        this.drawStatBar(hpBar, startX, startY + 35, this.barWidth, this.barHeight, hpPercent, 0xef4444);
        this.drawStatBar(mpBar, startX, startY + 35 + gap, this.barWidth, this.barHeight, mpPercent, 0x3b82f6);
        this.drawStatBar(staminaBar, startX, startY + 35 + (gap * 2), this.barWidth, this.barHeight, staminaPercent, 0x10b981);

        // 2. Overlay Text Numbers Second (Text Config Shared For Layout Sizing)
        const textStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold' };
        const textX = startX + (this.barWidth / 2);
        const halfBar = this.barHeight / 2;

        this.add.text(textX, startY + 35 + halfBar, `${hp.current}/${hp.max}`, textStyle).setOrigin(0.5);
        this.add.text(textX, startY + 35 + gap + halfBar, `${mp.current}/${mp.max}`, textStyle).setOrigin(0.5);
        this.add.text(textX, startY + 35 + (gap * 2) + halfBar, `${stam.current}/${stam.max}`, textStyle).setOrigin(0.5);
    }

    /**
     * 👹 Creates the Enemy's Top-Right UI Block with Text Labels
     */
    private createEnemyUI(screenWidth: number) {
        this.enemyUIX = screenWidth - this.barWidth - 40;
        this.enemyUIY = 40;
        const gap = 24;

        // Name
        this.add.text(this.enemyUIX, this.enemyUIY, this.enemyIdentity.name, {
            fontFamily: 'sans-serif',
            fontSize: '22px',
            color: '#ffb0b0',
            fontStyle: 'bold'
        });

        this.enemyHpBar = this.add.graphics(); 
        const mpBar = this.add.graphics();
        const staminaBar = this.add.graphics();

        const baseMp = (this.enemyTemplate as any).baseMp || 0; 
        
        const hpPercent = this.enemyTemplate.baseHp > 0 ? this.currentEnemyHp / this.enemyTemplate.baseHp : 0;
        const mpPercent = baseMp > 0 ? this.currentEnemyMp / baseMp : 0;
        const staminaPercent = this.enemyTemplate.baseStamina > 0 ? this.currentEnemyStamina / this.enemyTemplate.baseStamina : 0;

        // 1. Draw Graphics Bars
        this.drawStatBar(this.enemyHpBar, this.enemyUIX, this.enemyUIY + 35, this.barWidth, this.barHeight, hpPercent, 0xef4444);
        this.drawStatBar(mpBar, this.enemyUIX, this.enemyUIY + 35 + gap, this.barWidth, this.barHeight, mpPercent, 0x3b82f6);
        this.drawStatBar(staminaBar, this.enemyUIX, this.enemyUIY + 35 + (gap * 2), this.barWidth, this.barHeight, staminaPercent, 0x10b981);

        // 2. Overlay Text Numbers
        const textStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold' };
        const textX = this.enemyUIX + (this.barWidth / 2);
        const halfBar = this.barHeight / 2;

        // Assigned directly to our mutable property so we can alter it mid-fight
        this.enemyHpText = this.add.text(textX, this.enemyUIY + 35 + halfBar, `${this.currentEnemyHp}/${this.enemyTemplate.baseHp}`, textStyle).setOrigin(0.5);
        
        this.add.text(textX, this.enemyUIY + 35 + gap + halfBar, `${this.currentEnemyMp}/${baseMp}`, textStyle).setOrigin(0.5);
        this.add.text(textX, this.enemyUIY + 35 + (gap * 2) + halfBar, `${this.currentEnemyStamina}/${this.enemyTemplate.baseStamina}`, textStyle).setOrigin(0.5);
    }

    private createDebugActionButtons(width: number, height: number) {
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
            const damage = Math.floor(Math.random() * 5) + 3;
            this.currentEnemyHp = Math.max(0, this.currentEnemyHp - damage);
            
            // 🛠️ CHANGED: Update BOTH the graphics layout scale and the visual text display string live!
            const newHpPercent = this.enemyTemplate.baseHp > 0 ? this.currentEnemyHp / this.enemyTemplate.baseHp : 0;
            this.drawStatBar(this.enemyHpBar, this.enemyUIX, this.enemyUIY + 35, this.barWidth, this.barHeight, newHpPercent, 0xef4444);
            this.enemyHpText.setText(`${this.currentEnemyHp}/${this.enemyTemplate.baseHp}`);
            
            this.combatLogText.setText(`You strike the opponent dealing ${damage} damage!`);

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