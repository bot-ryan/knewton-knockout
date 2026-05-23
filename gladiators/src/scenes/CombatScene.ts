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
    private playerState!: PlayerData;
    private enemyTemplate!: EnemyTemplate;
    private enemyIdentity!: EnemyIdentity;

    private currentEnemyHp = 0;
    private currentEnemyMp = 0;
    private currentEnemyStamina = 0;

    private combatLogText!: Phaser.GameObjects.Text;
    private enemyHpBar!: Phaser.GameObjects.Graphics;
    private enemyHpText!: Phaser.GameObjects.Text;

    private enemyUIX = 0;
    private enemyUIY = 40;
    private barWidth = 200;
    private barHeight = 16;

    private playerStickman!: Stickman;
    private enemyGraphic!: Phaser.GameObjects.Graphics;

    // Grid Data
    private readonly GRID_SIZE = 80;
    private worldCenterX = 0;
    private playerGridX = -3;
    private enemyGridX = 3;
    private isPlayerTurn = true;

    // UI Camera & Container properties
    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    private uiContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('CombatScene');
    }

    // 🌟 IMPORTANT: You must have a preload method to load your background image!
    preload() {
        // Ensure this path matches where you saved 'forest_bg.png'
        this.load.image('forest_bg', 'assets/forest_bg.png');
    }

    init(data: CombatPayload) {
        if (!data || !data.enemyTemplate || !data.character) {
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
        this.worldCenterX = width / 2;

        this.uiContainer = this.add.container(0, 0);

        // --- 1. WORLD SETUP ---
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // 1. Grab the native dimensions of your background image
        const bgTexture = this.textures.get('forest_bg');
        const nativeHeight = bgTexture.getSourceImage().height;

        // 2. Set your desired scale factor (e.g., 1.2 or 1.5 if you want to upscale the pixel art)
        const bgScale = 1.35;
        const displayHeight = nativeHeight * bgScale;

        // 3. Create the TileSprite with the EXACT display height so it cannot tile vertically
        const bg = this.add.tileSprite(
            this.worldCenterX,
            height * 0.43, // 🌟 Tweak this Y anchor to perfectly align the forest floor with your characters
            4000,
            displayHeight,
            'forest_bg'
        );

        // 4. Apply the scale internally to the tile texture texture
        bg.setTileScale(bgScale, bgScale);

        bg.setDepth(-10); // Ensure it is behind everything
        bg.setScrollFactor(0.5); // Parallax effect: moves slower than camera

        const initialPlayerX = this.worldCenterX + (this.playerGridX * this.GRID_SIZE);
        const initialEnemyX = this.worldCenterX + (this.enemyGridX * this.GRID_SIZE);

        this.playerStickman = new Stickman(
            this, initialPlayerX, height * 0.52,
            this.playerState.appearance.skinColor, this.playerState.appearance.expression
        );

        this.enemyGraphic = this.add.graphics();
        this.enemyGraphic.fillStyle(this.enemyIdentity.skinColor, 1);
        this.enemyGraphic.fillRoundedRect(-25, -60, 50, 120, 16);
        this.enemyGraphic.setPosition(initialEnemyX, height * 0.52);

        // --- 2. UI SETUP ---
        const titleText = this.add.text(width / 2, 35, `ARENA TIER: ${this.enemyTemplate.tier}`, {
            fontFamily: 'Verdana', fontSize: '18px', color: '#7e87a2', letterSpacing: 2
        }).setOrigin(0.5);
        this.uiContainer.add(titleText);

        this.createPlayerUI();
        this.createEnemyUI(width);

        const logBox = this.add.graphics();
        logBox.fillStyle(0x07080d, 0.85);
        logBox.fillRoundedRect(40, height - 110, width - 80, 80, 8);
        logBox.lineStyle(2, 0x22253a, 1);
        logBox.strokeRoundedRect(40, height - 110, width - 80, 80, 8);

        this.combatLogText = this.add.text(60, height - 95, `Encounter begins! You face ${this.enemyIdentity.name}.`, {
            fontFamily: 'monospace', fontSize: '15px', color: '#cbd5e1', wordWrap: { width: width - 120 }
        });

        this.uiContainer.add([logBox, this.combatLogText]);
        this.createDebugActionButtons(width, height);

        // --- 3. DUAL CAMERA SETUP ---
        this.uiCamera = this.cameras.add(0, 0, width, height);
        this.cameras.main.ignore(this.uiContainer);

        const allSceneObjects = this.children.list;
        for (const obj of allSceneObjects) {
            if (obj !== this.uiContainer) {
                this.uiCamera.ignore(obj);
            }
        }

        this.updateDynamicCamera(0);
    }

    private updateDynamicCamera(duration: number = 400) {
        const pX = this.playerStickman.x;
        const eX = this.enemyGraphic.x;
        const midpointX = (pX + eX) / 2;
        const distance = Math.abs(pX - eX);
        const visualPadding = 450;
        const targetZoom = Phaser.Math.Clamp(this.scale.width / (distance + visualPadding), 0.6, 1.3);

        this.cameras.main.pan(midpointX, this.scale.height * 0.5, duration, 'Sine.easeInOut');
        this.cameras.main.zoomTo(targetZoom, duration, 'Sine.easeInOut');
    }

    private getPlayerMovementRange(): number {
        const dexterity = this.playerState.stats.dexterity;
        return 1 + Math.floor(dexterity / 20);
    }

    private movePlayer(direction: 'LEFT' | 'RIGHT') {
        if (!this.isPlayerTurn) return;
        this.isPlayerTurn = false;

        const distance = this.getPlayerMovementRange();
        const moveAmount = direction === 'LEFT' ? -distance : distance;

        const intendedGridX = this.playerGridX + moveAmount;
        if (intendedGridX >= this.enemyGridX) {
            this.playerGridX = this.enemyGridX - 1;
        } else {
            this.playerGridX = intendedGridX;
        }

        const targetX = this.worldCenterX + (this.playerGridX * this.GRID_SIZE);
        this.combatLogText.setText(`You dashed to the ${direction.toLowerCase()}.`);

        this.tweens.add({
            targets: this.playerStickman,
            x: targetX,
            duration: 400,
            ease: 'Sine.easeInOut',
            onUpdate: () => this.updateDynamicCamera(0),
            onComplete: () => {
                this.time.delayedCall(300, () => this.processEnemyTurn());
            }
        });
    }

    private processEnemyTurn() {
        if (this.currentEnemyHp <= 0) return;

        this.combatLogText.setText(`${this.enemyIdentity.name} is making a move...`);

        this.time.delayedCall(800, () => {
            const distanceBetween = Math.abs(this.enemyGridX - this.playerGridX);

            if (distanceBetween > 1) {
                this.enemyGridX -= 1;
                const targetX = this.worldCenterX + (this.enemyGridX * this.GRID_SIZE);

                this.combatLogText.setText(`${this.enemyIdentity.name} advances towards you!`);

                this.tweens.add({
                    targets: this.enemyGraphic,
                    x: targetX,
                    duration: 400,
                    ease: 'Sine.easeInOut',
                    onUpdate: () => this.updateDynamicCamera(0),
                    onComplete: () => this.endEnemyTurn()
                });
            } else {
                this.combatLogText.setText(`${this.enemyIdentity.name} strikes you!`);
                this.tweens.add({
                    targets: this.playerStickman,
                    alpha: 0.3, yoyo: true, duration: 60, repeat: 1,
                    onComplete: () => this.endEnemyTurn()
                });
            }
        });
    }

    private endEnemyTurn() {
        this.isPlayerTurn = true;
        this.combatLogText.setText(`It is your turn.`);
    }

    private executeAction(type: 'QUICK' | 'NORMAL' | 'POWER' | 'CHARGE' | 'REST' | 'TAUNT') {
        if (!this.isPlayerTurn) return;

        const distanceBetween = Math.abs(this.enemyGridX - this.playerGridX);
        let damage = 0;

        switch (type) {
            case 'QUICK':
                if (distanceBetween > 1) {
                    this.combatLogText.setText(`Enemy is too far away for a QUICK strike! Move closer.`);
                    return;
                }
                this.isPlayerTurn = false;
                damage = Math.floor(Math.random() * 3) + 2; // Low fast damage
                this.combatLogText.setText(`Lightning Jab! You strike dealing ${damage} damage!`);
                this.applyDamageToEnemy(damage);
                break;

            case 'NORMAL':
                if (distanceBetween > 1) {
                    this.combatLogText.setText(`Enemy is too far away to strike! Move closer.`);
                    return;
                }
                this.isPlayerTurn = false;
                damage = Math.floor(Math.random() * 5) + 3; // Regular damage
                this.combatLogText.setText(`Standard Strike! You hit dealing ${damage} damage!`);
                this.applyDamageToEnemy(damage);
                break;

            case 'POWER':
                if (distanceBetween > 1) {
                    this.combatLogText.setText(`Enemy is too far away for a heavy POWER blow! Move closer.`);
                    return;
                }
                this.isPlayerTurn = false;
                damage = Math.floor(Math.random() * 8) + 6; // High damage
                this.combatLogText.setText(`Heavy Swing! You crush them for ${damage} damage!`);
                this.applyDamageToEnemy(damage);
                break;

            case 'CHARGE':
                this.isPlayerTurn = false;
                this.combatLogText.setText(`You lunge forward aggressively to close the distance!`);

                // Advance player position right next to the enemy
                this.playerGridX = this.enemyGridX - 1;
                const targetX = this.worldCenterX + (this.playerGridX * this.GRID_SIZE);

                this.tweens.add({
                    targets: this.playerStickman,
                    x: targetX,
                    duration: 300,
                    ease: 'Quad.easeOut',
                    onUpdate: () => this.updateDynamicCamera(0),
                    onComplete: () => {
                        damage = Math.floor(Math.random() * 4) + 3;
                        this.combatLogText.setText(`Charge hits! You slammed into them for ${damage} damage!`);
                        this.applyDamageToEnemy(damage);
                    }
                });
                break;

            case 'REST':
                this.isPlayerTurn = false;
                this.combatLogText.setText(`You drop into a defensive stance to catch your breath and recover focus.`);
                // Placeholder behavior for turn transition
                this.time.delayedCall(1000, () => this.processEnemyTurn());
                break;

            case 'TAUNT':
                this.isPlayerTurn = false;
                this.combatLogText.setText(`You mock them openly! "Hey ${this.enemyIdentity.name}, my grandmother hits harder than that!"`);
                // Placeholder behavior for turn transition
                this.time.delayedCall(1000, () => this.processEnemyTurn());
                break;
        }
    }

    private applyDamageToEnemy(damage: number) {
        this.currentEnemyHp = Math.max(0, this.currentEnemyHp - damage);

        const newHpPercent = this.enemyTemplate.baseHp > 0 ? this.currentEnemyHp / this.enemyTemplate.baseHp : 0;
        this.drawStatBar(this.enemyHpBar, this.enemyUIX, this.enemyUIY + 35, this.barWidth, this.barHeight, newHpPercent, 0xef4444);
        this.enemyHpText.setText(`${this.currentEnemyHp}/${this.enemyTemplate.baseHp}`);

        this.tweens.add({
            targets: this.enemyGraphic,
            alpha: 0.3, yoyo: true, duration: 60, repeat: 1,
            onComplete: () => {
                if (this.currentEnemyHp <= 0) {
                    this.combatLogText.setText(`Victory! Leaving arena...`);
                    this.time.delayedCall(1500, () => {
                        this.cameras.main.fadeOut(250, 0, 0, 0);
                        this.uiCamera.fadeOut(250, 0, 0, 0);
                        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('OpenMap'));
                    });
                } else {
                    this.time.delayedCall(500, () => this.processEnemyTurn());
                }
            }
        });
    }

    private drawStatBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, percentage: number, color: number) {
        graphics.clear();
        graphics.fillStyle(0x222222, 1);
        graphics.fillRect(x, y, width, height);
        const clampedPercent = Math.max(0, Math.min(1, percentage));
        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, width * clampedPercent, height);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x, y, width, height);
    }

    private createPlayerUI() {
        const startX = 40; const startY = 40; const gap = 24;
        const nameText = this.add.text(startX, startY, this.playerState.name.toUpperCase(), { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' });

        const hpBar = this.add.graphics(); const mpBar = this.add.graphics(); const staminaBar = this.add.graphics();
        const hp = this.playerState.secondaryStats.hp; const mp = this.playerState.secondaryStats.mp; const stam = this.playerState.secondaryStats.stamina;
        const hpPercent = hp.max > 0 ? hp.current / hp.max : 0; const mpPercent = mp.max > 0 ? mp.current / mp.max : 0; const staminaPercent = stam.max > 0 ? stam.current / stam.max : 0;

        this.drawStatBar(hpBar, startX, startY + 35, this.barWidth, this.barHeight, hpPercent, 0xef4444);
        this.drawStatBar(mpBar, startX, startY + 35 + gap, this.barWidth, this.barHeight, mpPercent, 0x3b82f6);
        this.drawStatBar(staminaBar, startX, startY + 35 + (gap * 2), this.barWidth, this.barHeight, staminaPercent, 0x10b981);

        const textStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold' };
        const textX = startX + (this.barWidth / 2); const halfBar = this.barHeight / 2;

        const t1 = this.add.text(textX, startY + 35 + halfBar, `${hp.current}/${hp.max}`, textStyle).setOrigin(0.5);
        const t2 = this.add.text(textX, startY + 35 + gap + halfBar, `${mp.current}/${mp.max}`, textStyle).setOrigin(0.5);
        const t3 = this.add.text(textX, startY + 35 + (gap * 2) + halfBar, `${stam.current}/${stam.max}`, textStyle).setOrigin(0.5);

        this.uiContainer.add([nameText, hpBar, mpBar, staminaBar, t1, t2, t3]);
    }

    private createEnemyUI(screenWidth: number) {
        this.enemyUIX = screenWidth - this.barWidth - 40; this.enemyUIY = 40; const gap = 24;
        const nameText = this.add.text(screenWidth - 40, this.enemyUIY, this.enemyIdentity.name, { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffb0b0', fontStyle: 'bold' }).setOrigin(1, 0);

        this.enemyHpBar = this.add.graphics(); const mpBar = this.add.graphics(); const staminaBar = this.add.graphics();
        const baseMp = (this.enemyTemplate as any).baseMp || 0;
        const hpPercent = this.enemyTemplate.baseHp > 0 ? this.currentEnemyHp / this.enemyTemplate.baseHp : 0;
        const mpPercent = baseMp > 0 ? this.currentEnemyMp / baseMp : 0;
        const staminaPercent = this.enemyTemplate.baseStamina > 0 ? this.currentEnemyStamina / this.enemyTemplate.baseStamina : 0;

        this.drawStatBar(this.enemyHpBar, this.enemyUIX, this.enemyUIY + 35, this.barWidth, this.barHeight, hpPercent, 0xef4444);
        this.drawStatBar(mpBar, this.enemyUIX, this.enemyUIY + 35 + gap, this.barWidth, this.barHeight, mpPercent, 0x3b82f6);
        this.drawStatBar(staminaBar, this.enemyUIX, this.enemyUIY + 35 + (gap * 2), this.barWidth, this.barHeight, staminaPercent, 0x10b981);

        const textStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold' };
        const textX = this.enemyUIX + (this.barWidth / 2); const halfBar = this.barHeight / 2;

        this.enemyHpText = this.add.text(textX, this.enemyUIY + 35 + halfBar, `${this.currentEnemyHp}/${this.enemyTemplate.baseHp}`, textStyle).setOrigin(0.5);
        const t2 = this.add.text(textX, this.enemyUIY + 35 + gap + halfBar, `${this.currentEnemyMp}/${baseMp}`, textStyle).setOrigin(0.5);
        const t3 = this.add.text(textX, this.enemyUIY + 35 + (gap * 2) + halfBar, `${this.currentEnemyStamina}/${this.enemyTemplate.baseStamina}`, textStyle).setOrigin(0.5);

        this.uiContainer.add([nameText, this.enemyHpBar, mpBar, staminaBar, this.enemyHpText, t2, t3]);
    }

    private createDebugActionButtons(width: number, height: number) {
        const buttonActions = [
            { label: '⬅️ LEFT', action: () => this.movePlayer('LEFT') },
            { label: 'RIGHT ➡️', action: () => this.movePlayer('RIGHT') },
            { label: '⚡ QUICK', action: () => this.executeAction('QUICK') },
            { label: '⚔️ NORMAL', action: () => this.executeAction('NORMAL') },
            { label: '💥 POWER', action: () => this.executeAction('POWER') },
            { label: '🏃 CHARGE', action: () => this.executeAction('CHARGE') },
            { label: '💤 REST', action: () => this.executeAction('REST') },
            { label: '🗣️ TAUNT', action: () => this.executeAction('TAUNT') }
        ];

        const buttonsPerRow = 4;
        const buttonWidth = 120;
        const buttonHeight = 36;
        const gapX = 16;
        const gapY = 12;

        const totalGridWidth = (buttonsPerRow * buttonWidth) + ((buttonsPerRow - 1) * gapX);
        const startX = (width - totalGridWidth) / 2 + (buttonWidth / 2);
        const startY = height - 200;

        buttonActions.forEach((btn, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;

            const x = startX + (col * (buttonWidth + gapX));
            const y = startY + (row * (buttonHeight + gapY));

            // Color-coding: Red for striking/charging attacks, Blue for movement/utility steps
            const pureKey = btn.label.replace(/[^A-Z]/g, '');
            let btnColor = '#2563eb';
            if (['QUICK', 'NORMAL', 'POWER', 'CHARGE'].includes(pureKey)) {
                btnColor = '#dc2626';
            }

            const actionBtn = this.add.text(x, y, btn.label, {
                backgroundColor: btnColor,
                padding: { x: 10, y: 8 },
                fontFamily: 'sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
                fixedWidth: buttonWidth
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', btn.action);

            actionBtn.on('pointerover', () => actionBtn.setAlpha(0.8));
            actionBtn.on('pointerout', () => actionBtn.setAlpha(1.0));

            this.uiContainer.add(actionBtn);
        });
    }
}