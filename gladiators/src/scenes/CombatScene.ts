// src/scenes/CombatScene.ts
import Phaser from 'phaser';
import { Stickman } from '../components/Stickman';
import { type PlayerData } from '../data/playerData';
import { type EnemyTemplate } from '../data/Enemy/EnemyArchetypes';
import { generateEnemyIdentity, type EnemyIdentity } from '../data/Enemy/EnemyIdentity';
import { LogBox } from '../components/ui/LogBox';
import { StatBar } from '../components/ui/StatBar'; // IMPORTED STATBAR

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

    private logBox!: LogBox;

    // Upgraded to our custom StatBar component types
    private playerHpBar!: StatBar;
    private playerMpBar!: StatBar;
    private playerStaminaBar!: StatBar;

    private enemyHpBar!: StatBar;
    private enemyMpBar!: StatBar;
    private enemyStaminaBar!: StatBar;

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

    preload() {
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

        const bgTexture = this.textures.get('forest_bg');
        const nativeHeight = bgTexture.getSourceImage().height;
        const bgScale = 1.35;
        const displayHeight = nativeHeight * bgScale;

        const bg = this.add.tileSprite(
            this.worldCenterX,
            height * 0.43,
            4000,
            displayHeight,
            'forest_bg'
        );

        bg.setTileScale(bgScale, bgScale);
        bg.setDepth(-10);
        bg.setScrollFactor(0.5);

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

        // Cleaned up the legacy duplicate logBox background drawings here!
        this.logBox = new LogBox(this, 40, height - 110, width - 80, 80);
        this.uiContainer.add(this.logBox);

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
        this.logBox.log(`You dashed to the ${direction.toLowerCase()}.`);

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

        this.logBox.log(`${this.enemyIdentity.name} is making a move...`);

        this.time.delayedCall(800, () => {
            const distanceBetween = Math.abs(this.enemyGridX - this.playerGridX);

            if (distanceBetween > 1) {
                this.enemyGridX -= 1;
                const targetX = this.worldCenterX + (this.enemyGridX * this.GRID_SIZE);

                this.logBox.log(`${this.enemyIdentity.name} advances towards you!`);

                this.tweens.add({
                    targets: this.enemyGraphic,
                    x: targetX,
                    duration: 400,
                    ease: 'Sine.easeInOut',
                    onUpdate: () => this.updateDynamicCamera(0),
                    onComplete: () => this.endEnemyTurn()
                });
            } else {
                this.logBox.log(`${this.enemyIdentity.name} strikes you!`);
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
        this.logBox.log(`It is your turn.`);
    }

    private executeAction(type: 'QUICK' | 'NORMAL' | 'POWER' | 'CHARGE' | 'REST' | 'TAUNT') {
        if (!this.isPlayerTurn) return;

        const distanceBetween = Math.abs(this.enemyGridX - this.playerGridX);
        let damage = 0;

        switch (type) {
            case 'QUICK':
                if (distanceBetween > 1) {
                    this.logBox.log(`Enemy is too far away for a QUICK strike! Move closer.`);
                    return;
                }
                this.isPlayerTurn = false;
                damage = Math.floor(Math.random() * 3) + 2;
                this.logBox.log(`Lightning Jab! You strike dealing ${damage} damage!`);
                this.applyDamageToEnemy(damage);
                break;

            case 'NORMAL':
                if (distanceBetween > 1) {
                    this.logBox.log(`Enemy is too far away to strike! Move closer.`);
                    return;
                }
                this.isPlayerTurn = false;
                damage = Math.floor(Math.random() * 5) + 3;
                this.logBox.log(`Standard Strike! You hit dealing ${damage} damage!`);
                this.applyDamageToEnemy(damage);
                break;

            case 'POWER':
                if (distanceBetween > 1) {
                    this.logBox.log(`Enemy is too far away for a heavy POWER blow! Move closer.`);
                    return;
                }
                this.isPlayerTurn = false;
                damage = Math.floor(Math.random() * 8) + 6;
                this.logBox.log(`Heavy Swing! You crush them for ${damage} damage!`);
                this.applyDamageToEnemy(damage);
                break;

            case 'CHARGE':
                this.isPlayerTurn = false;
                this.logBox.log(`You lunge forward aggressively to close the distance!`);

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
                        this.logBox.log(`Charge hits! You slammed into them for ${damage} damage!`);
                        this.applyDamageToEnemy(damage);
                    }
                });
                break;

            case 'REST':
                this.isPlayerTurn = false;
                this.logBox.log(`You drop into a defensive stance to catch your breath and recover focus.`);
                this.time.delayedCall(1000, () => this.processEnemyTurn());
                break;

            case 'TAUNT':
                this.isPlayerTurn = false;
                this.logBox.log(`You mock them openly! "Hey ${this.enemyIdentity.name}, my grandmother hits harder than that!"`);
                this.time.delayedCall(1000, () => this.processEnemyTurn());
                break;
        }
    }

    private applyDamageToEnemy(damage: number) {
        this.currentEnemyHp = Math.max(0, this.currentEnemyHp - damage);

        // CLEAN & SNAPPY: The StatBar automatically manages percentages and text formatting now!
        this.enemyHpBar.update(this.currentEnemyHp, this.enemyTemplate.baseHp);

        this.tweens.add({
            targets: this.enemyGraphic,
            alpha: 0.3, yoyo: true, duration: 60, repeat: 1,
            onComplete: () => {
                if (this.currentEnemyHp <= 0) {
                    this.logBox.log(`Victory! Leaving arena...`);
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

    private createPlayerUI() {
        const startX = 40; const startY = 40; const gap = 24;
        const nameText = this.add.text(startX, startY, this.playerState.name.toUpperCase(), { 
            fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' 
        });

        const hp = this.playerState.secondaryStats.hp; 
        const mp = this.playerState.secondaryStats.mp; 
        const stam = this.playerState.secondaryStats.stamina;

        // Instantiate component stat bars
        this.playerHpBar = new StatBar(this, startX, startY + 35, this.barWidth, this.barHeight, 0xef4444);
        this.playerMpBar = new StatBar(this, startX, startY + 35 + gap, this.barWidth, this.barHeight, 0x3b82f6);
        this.playerStaminaBar = new StatBar(this, startX, startY + 35 + (gap * 2), this.barWidth, this.barHeight, 0x10b981);

        // Feed data updates
        this.playerHpBar.update(hp.current, hp.max);
        this.playerMpBar.update(mp.current, mp.max);
        this.playerStaminaBar.update(stam.current, stam.max);

        this.uiContainer.add([nameText, this.playerHpBar, this.playerMpBar, this.playerStaminaBar]);
    }

    private createEnemyUI(screenWidth: number) {
        this.enemyUIX = screenWidth - this.barWidth - 40; this.enemyUIY = 40; const gap = 24;
        const nameText = this.add.text(screenWidth - 40, this.enemyUIY, this.enemyIdentity.name, { 
            fontFamily: 'sans-serif', fontSize: '22px', color: '#ffb0b0', fontStyle: 'bold' 
        }).setOrigin(1, 0);

        const baseMp = (this.enemyTemplate as any).baseMp || 0;

        // Instantiate component stat bars
        this.enemyHpBar = new StatBar(this, this.enemyUIX, this.enemyUIY + 35, this.barWidth, this.barHeight, 0xef4444);
        this.enemyMpBar = new StatBar(this, this.enemyUIX, this.enemyUIY + 35 + gap, this.barWidth, this.barHeight, 0x3b82f6);
        this.enemyStaminaBar = new StatBar(this, this.enemyUIX, this.enemyUIY + 35 + (gap * 2), this.barWidth, this.barHeight, 0x10b981);

        // Feed data updates
        this.enemyHpBar.update(this.currentEnemyHp, this.enemyTemplate.baseHp);
        this.enemyMpBar.update(this.currentEnemyMp, baseMp);
        this.enemyStaminaBar.update(this.currentEnemyStamina, this.enemyTemplate.baseStamina);

        this.uiContainer.add([nameText, this.enemyHpBar, this.enemyMpBar, this.enemyStaminaBar]);
    }

    private createDebugActionButtons(width: number, height: number) {
       const buttonActions = [
            { label: '⬅️ LEFT', description: 'Dash left to increase distance.', action: () => this.movePlayer('LEFT') },
            { label: 'RIGHT ➡️', description: 'Dash right to close the distance.', action: () => this.movePlayer('RIGHT') },
            { label: '⚡ QUICK', description: 'A fast, low-damage strike. Requires close range.', action: () => this.executeAction('QUICK') },
            { label: '⚔️ NORMAL', description: 'A standard melee attack. Requires close range.', action: () => this.executeAction('NORMAL') },
            { label: '💥 POWER', description: 'A heavy, high-damage blow. Requires close range.', action: () => this.executeAction('POWER') },
            { label: '🏃 CHARGE', description: 'Lunge forward and strike immediately!', action: () => this.executeAction('CHARGE') },
            { label: '💤 REST', description: 'Defend and catch your breath to restore stamina.', action: () => this.executeAction('REST') },
            { label: '🗣️ TAUNT', description: 'Mock the enemy. May alter their behavior.', action: () => this.executeAction('TAUNT') }
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

            actionBtn.on('pointerover', () => {
                actionBtn.setAlpha(0.8);
                this.logBox.showTooltip(btn.description);
            });

            actionBtn.on('pointerout', () => {
                actionBtn.setAlpha(1.0);
                this.logBox.clearTooltip();
            });

            this.uiContainer.add(actionBtn);
        });
    }
}