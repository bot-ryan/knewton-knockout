// src/scenes/CombatScene.ts
import Phaser from 'phaser';
import { type PlayerData } from '../data/playerData';
import { type EnemyTemplate } from '../data/Enemy/EnemyArchetypes';
import { generateEnemyIdentity, type EnemyIdentity } from '../data/Enemy/EnemyIdentity';
import { LogBox } from '../components/ui/LogBox';
import { StatBar } from '../components/ui/StatBar';
import { BattleEntity } from '../components/BattleEntity';
import { ActionMenu, type ActionItem } from '../components/ui/ActionMenu';

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

    // Upgraded from loose primitives to unified combat entity managers
    private playerEntity!: BattleEntity;
    private enemyEntity!: BattleEntity;

    // Configuration
    private readonly GRID_SIZE = 80;
    private worldCenterX = 0;
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

        const bg = this.add.tileSprite(this.worldCenterX, height * 0.43, 4000, displayHeight, 'forest_bg');
        bg.setTileScale(bgScale, bgScale);
        bg.setDepth(-10);
        bg.setScrollFactor(0.5);

        // --- 2. ENTITY SPAWNING ---
        // Spawn Player Entity
        this.playerEntity = new BattleEntity(this, -3, height * 0.52, this.worldCenterX, this.GRID_SIZE, {
            skinColor: this.playerState.appearance.skinColor,
            expression: this.playerState.appearance.expression,
            scale: 1.4
        });

        // Spawn Enemy Entity as a real stickman using random generated features!
        this.enemyEntity = new BattleEntity(this, 3, height * 0.52, this.worldCenterX, this.GRID_SIZE, {
            skinColor: this.enemyIdentity.skinColor,
            expression: this.enemyIdentity.expression,
            scale: 1.4
        });

        // --- 3. UI SETUP ---
        const titleText = this.add.text(width / 2, 35, `ARENA TIER: ${this.enemyTemplate.tier}`, {
            fontFamily: 'Verdana', fontSize: '18px', color: '#7e87a2', letterSpacing: 2
        }).setOrigin(0.5);
        this.uiContainer.add(titleText);

        this.createPlayerUI();
        this.createEnemyUI(width);

        this.logBox = new LogBox(this, 40, height - 110, width - 80, 80);
        this.uiContainer.add(this.logBox);

        // --- 4. ACTION MENU SETUP ---
        const buttonActions: ActionItem[] = [
            { label: '⬅️ LEFT', description: 'Dash left to increase distance.', isAttack: false, action: () => this.movePlayer('LEFT') },
            { label: 'RIGHT ➡️', description: 'Dash right to close the distance.', isAttack: false, action: () => this.movePlayer('RIGHT') },
            { label: '⚡ QUICK', description: 'A fast, low-damage strike. Requires close range.', isAttack: true, action: () => this.executeAction('QUICK') },
            { label: '⚔️ NORMAL', description: 'A standard melee attack. Requires close range.', isAttack: true, action: () => this.executeAction('NORMAL') },
            { label: '💥 POWER', description: 'A heavy, high-damage blow. Requires close range.', isAttack: true, action: () => this.executeAction('POWER') },
            { label: '🏃 CHARGE', description: 'Lunge forward and strike immediately!', isAttack: true, action: () => this.executeAction('CHARGE') },
            { label: '💤 REST', description: 'Defend and catch your breath to restore stamina.', isAttack: false, action: () => this.executeAction('REST') },
            { label: '🗣️ TAUNT', description: 'Mock the enemy. May alter their behavior.', isAttack: false, action: () => this.executeAction('TAUNT') }
        ];

        // Instantiate the ActionMenu and pass the tooltip callbacks directly to the LogBox
        const actionMenu = new ActionMenu(
            this,
            this.worldCenterX,
            height - 200,
            buttonActions,
            (desc) => this.logBox.showTooltip(desc),
            () => this.logBox.clearTooltip()
        );

        // Add it to the UI camera container so it doesn't move when zooming
        this.uiContainer.add(actionMenu);

        // --- 5. DUAL CAMERA SETUP ---
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
        if (!this.playerEntity || !this.enemyEntity) return;

        const pX = this.playerEntity.x;
        const eX = this.enemyEntity.x;
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

        const intendedGridX = this.playerEntity.gridX + moveAmount;
        // Keep player at least one tile away from enemy boundary
        const finalGridX = intendedGridX >= this.enemyEntity.gridX ? this.enemyEntity.gridX - 1 : intendedGridX;

        this.logBox.log(`You dashed to the ${direction.toLowerCase()}.`);

        this.playerEntity.animateToGrid(finalGridX, 400, () => this.updateDynamicCamera(0))
            .then(() => {
                this.time.delayedCall(300, () => this.processEnemyTurn());
            });
    }

    private processEnemyTurn() {
        if (this.currentEnemyHp <= 0) return;

        this.logBox.log(`${this.enemyIdentity.name} is making a move...`);

        this.time.delayedCall(800, () => {
            const distanceBetween = Math.abs(this.enemyEntity.gridX - this.playerEntity.gridX);

            if (distanceBetween > 1) {
                const finalGridX = this.enemyEntity.gridX - 1;
                this.logBox.log(`${this.enemyIdentity.name} advances towards you!`);

                this.enemyEntity.animateToGrid(finalGridX, 400, () => this.updateDynamicCamera(0))
                    .then(() => this.endEnemyTurn());
            } else {
                this.logBox.log(`${this.enemyIdentity.name} strikes you!`);
                this.playerEntity.playDamageFlash()
                    .then(() => this.endEnemyTurn());
            }
        });
    }

    private endEnemyTurn() {
        this.isPlayerTurn = true;
        this.logBox.log(`It is your turn.`);
    }

    private executeAction(type: 'QUICK' | 'NORMAL' | 'POWER' | 'CHARGE' | 'REST' | 'TAUNT') {
    if (!this.isPlayerTurn) return;

    const distanceBetween = Math.abs(this.enemyEntity.gridX - this.playerEntity.gridX);
    
    // 1. Stamina Cost Definition
    const costs = { 'QUICK': 5, 'NORMAL': 10, 'POWER': 20, 'CHARGE': 15 };
    const currentStamina = this.playerState.secondaryStats.stamina.current;

    // 2. Logic Check
    if (['QUICK', 'NORMAL', 'POWER', 'CHARGE'].includes(type)) {
        if (distanceBetween > 1 && type !== 'CHARGE') {
             this.logBox.log(`Enemy is too far away!`);
             return;
        }
        
        // Check Stamina
        if (currentStamina < (costs[type as keyof typeof costs] || 0)) {
            this.logBox.log(`Not enough stamina to perform ${type}!`);
            return;
        }
        
        // Deduct Stamina (Update UI + State)
        this.playerState.secondaryStats.stamina.current -= (costs[type as keyof typeof costs] || 0);
        this.playerStaminaBar.update(this.playerState.secondaryStats.stamina.current, this.playerState.secondaryStats.stamina.max);
    }

    // 3. Execution
    this.isPlayerTurn = false;
    
    if (type === 'CHARGE') {
         this.playerEntity.animateToGrid(this.enemyEntity.gridX - 1, 300, () => this.updateDynamicCamera(0))
            .then(() => {
                const dmg = this.calculateDamage('NORMAL'); // Charge counts as a normal hit
                this.logBox.log(`Charged! Dealt ${dmg} damage.`);
                this.applyDamageToEnemy(dmg);
            });
    } else if (['QUICK', 'NORMAL', 'POWER'].includes(type)) {
        const dmg = this.calculateDamage(type as any);
        this.logBox.log(`You used ${type}! Dealt ${dmg} damage.`);
        this.applyDamageToEnemy(dmg);
    } else if (type === 'REST') {
        this.logBox.log(`You rest and recover stamina.`);
        this.playerState.secondaryStats.stamina.current = Math.min(
            this.playerState.secondaryStats.stamina.max, 
            this.playerState.secondaryStats.stamina.current + 20
        );
        this.playerStaminaBar.update(this.playerState.secondaryStats.stamina.current, this.playerState.secondaryStats.stamina.max);
        this.time.delayedCall(1000, () => this.processEnemyTurn());
    } else if (type === 'TAUNT') {
        // ... (Keep your existing taunt logic)
        this.time.delayedCall(1000, () => this.processEnemyTurn());
    }
}

    /**
 * Calculates damage based on player stats.
 * Formula: BaseValue + (Strength * 0.3) + Random Variance
 */
    private calculateDamage(type: 'QUICK' | 'NORMAL' | 'POWER'): number {
        const strength = this.playerState.stats.strength;

        // Define base power for each attack type
        const baseDamageMap = {
            'QUICK': 2,
            'NORMAL': 5,
            'POWER': 10
        };

        const base = baseDamageMap[type];
        const scaling = Math.floor(strength * 0.3); // 30% of strength adds to damage
        const variance = Math.floor(Math.random() * 3); // A little randomness for feel

        return base + scaling + variance;
    }

    private applyDamageToEnemy(damage: number) {
        this.currentEnemyHp = Math.max(0, this.currentEnemyHp - damage);
        this.enemyHpBar.update(this.currentEnemyHp, this.enemyTemplate.baseHp);

        // Run the damage visual feedback animation out of our generic wrapper class
        this.enemyEntity.playDamageFlash().then(() => {
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

        this.playerHpBar = new StatBar(this, startX, startY + 35, this.barWidth, this.barHeight, 0xef4444);
        this.playerMpBar = new StatBar(this, startX, startY + 35 + gap, this.barWidth, this.barHeight, 0x3b82f6);
        this.playerStaminaBar = new StatBar(this, startX, startY + 35 + (gap * 2), this.barWidth, this.barHeight, 0x10b981);

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

        this.enemyHpBar = new StatBar(this, this.enemyUIX, this.enemyUIY + 35, this.barWidth, this.barHeight, 0xef4444);
        this.enemyMpBar = new StatBar(this, this.enemyUIX, this.enemyUIY + 35 + gap, this.barWidth, this.barHeight, 0x3b82f6);
        this.enemyStaminaBar = new StatBar(this, this.enemyUIX, this.enemyUIY + 35 + (gap * 2), this.barWidth, this.barHeight, 0x10b981);

        this.enemyHpBar.update(this.currentEnemyHp, this.enemyTemplate.baseHp);
        this.enemyMpBar.update(this.currentEnemyMp, baseMp);
        this.enemyStaminaBar.update(this.currentEnemyStamina, this.enemyTemplate.baseStamina);

        this.uiContainer.add([nameText, this.enemyHpBar, this.enemyMpBar, this.enemyStaminaBar]);
    }


}