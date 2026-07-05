// src/scenes/CombatScene.ts
import Phaser from 'phaser';
import { type PlayerData } from '../data/PlayerData';
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
    private actionMenu!: ActionMenu;

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

    private playerEntity!: BattleEntity;
    private enemyEntity!: BattleEntity;

    private readonly GRID_SIZE = 80;
    private worldCenterX = 0;
    
    // Upgraded to a 3-state system to prevent click-spamming during animations
    private turnState: 'PLAYER' | 'ENEMY' | 'LOCKED' = 'PLAYER';

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
        // Safely fallback if baseMp doesn't exist on the type yet
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
        const bgScale = 1.35;
        const bg = this.add.tileSprite(this.worldCenterX, height * 0.43, 4000, bgTexture.getSourceImage().height * bgScale, 'forest_bg');
        bg.setTileScale(bgScale, bgScale).setDepth(-10).setScrollFactor(0.5);

        // --- 2. ENTITIES ---
        this.playerEntity = new BattleEntity(this, -3, height * 0.52, this.worldCenterX, this.GRID_SIZE, {
            skinColor: this.playerState.appearance.skinColor,
            expression: this.playerState.appearance.expression,
            scale: 1.4
        });

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
            { label: '⬅️ LEFT', description: 'Dash left.', isAttack: false, action: () => this.movePlayer('LEFT') },
            { label: 'RIGHT ➡️', description: 'Dash right.', isAttack: false, action: () => this.movePlayer('RIGHT') },
            { label: '⚡ QUICK', description: 'Fast, low-damage strike.', isAttack: true, isDisabled: () => this.getDistance() > 1, action: () => this.executeAction('QUICK') },
            { label: '⚔️ NORMAL', description: 'Standard melee attack.', isAttack: true, isDisabled: () => this.getDistance() > 1, action: () => this.executeAction('NORMAL') },
            { label: '💥 POWER', description: 'Heavy, high-damage blow.', isAttack: true, isDisabled: () => this.getDistance() > 1, action: () => this.executeAction('POWER') },
            { label: '🏃 CHARGE', description: 'Lunge and strike!', isAttack: true, isDisabled: () => this.getDistance() === 1, action: () => this.executeAction('CHARGE') },
            { label: '💤 REST', description: 'Recover stamina.', isAttack: false, action: () => this.executeAction('REST') },
            { label: '🗣️ TAUNT', description: 'Mock the enemy.', isAttack: false, action: () => this.executeAction('TAUNT') }
        ];

        this.actionMenu = new ActionMenu(
            this, this.worldCenterX, height - 200, buttonActions,
            (desc) => this.logBox.showTooltip(desc),
            () => this.logBox.clearTooltip()
        );
        this.uiContainer.add(this.actionMenu);

        // --- 5. CAMERA SETUP ---
        this.uiCamera = this.cameras.add(0, 0, width, height);
        this.cameras.main.ignore(this.uiContainer);

        for (const obj of this.children.list) {
            if (obj !== this.uiContainer) this.uiCamera.ignore(obj);
        }

        this.updateDynamicCamera(0);
        this.startPlayerTurn(); // Initialize turn state properly
    }

    // --- HELPERS & MATH ---
    private getDistance(): number {
        return Math.abs(this.enemyEntity.gridX - this.playerEntity.gridX);
    }

    private updateDynamicCamera(duration: number = 400) {
        if (!this.playerEntity || !this.enemyEntity) return;
        const midpointX = (this.playerEntity.x + this.enemyEntity.x) / 2;
        const targetZoom = Phaser.Math.Clamp(this.scale.width / (Math.abs(this.playerEntity.x - this.enemyEntity.x) + 450), 0.6, 1.3);

        this.cameras.main.pan(midpointX, this.scale.height * 0.5, duration, 'Sine.easeInOut');
        this.cameras.main.zoomTo(targetZoom, duration, 'Sine.easeInOut');
    }

    private showFloatingText(x: number, y: number, text: string, color: string) {
        const floatText = this.add.text(x, y - 60, text, {
            fontFamily: 'sans-serif', fontSize: '26px', color: color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        
        this.uiCamera.ignore(floatText); // Keep in world space to zoom properly

        this.tweens.add({
            targets: floatText, y: y - 120, alpha: 0, duration: 1200, ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy()
        });
    }

    // Add these to CombatScene.ts

// Replace your existing updateActionLabels method with this:
private updateActionLabels() {
    const prec = this.playerState.stats.precision;
    const guard = this.enemyTemplate.stats.guard;
    const base = 80 + (prec - guard);

    // Helper to calculate clamp
    const getChance = (mod: number) => Phaser.Math.Clamp(base + mod, 5, 95);

    // Update labels specifically
    this.actionMenu.updateLabel(2, `⚡ QUICK (${getChance(10)}%)`);
    this.actionMenu.updateLabel(3, `⚔️ NORMAL (${getChance(0)}%)`);
    this.actionMenu.updateLabel(4, `💥 POWER (${getChance(-20)}%)`);
    this.actionMenu.updateLabel(5, `🏃 CHARGE (${getChance(0)}%)`);
}

// Ensure you update your internal combat logic to use these stats too!
// Add this to your CombatScene class
private calculateHit(attackerPrec: number, defenderGuard: number, type: 'QUICK' | 'NORMAL' | 'POWER' | 'CHARGE'): boolean {
    // Define the risk/reward modifiers
    const modifiers = {
        'QUICK': 10,   // +10% Accuracy
        'NORMAL': 0,   // Base
        'POWER': -20,  // -20% Accuracy (Risky)
        'CHARGE': 0    // Base (Same as normal)
    };

    // Calculate base chance + modifiers
    const baseChance = 80 + (attackerPrec - defenderGuard);
    const hitChance = Phaser.Math.Clamp(baseChance + modifiers[type], 5, 95);
    
    return (Math.random() * 100) <= hitChance;
}

    

    private calculateDamage(attackerStr: number, type: 'QUICK' | 'NORMAL' | 'POWER'): number {
        const base = { 'QUICK': 2, 'NORMAL': 5, 'POWER': 10 }[type];
        return base + Math.floor(attackerStr * 0.3) + Math.floor(Math.random() * 3);
    }

    // --- TURN MANAGEMENT ---
    private startPlayerTurn() {
    if (this.playerState.secondaryStats.stamina.current <= 0) {
        this.turnState = 'LOCKED';
        this.logBox.log(`You are exhausted! Forced to catch your breath.`);
        this.time.delayedCall(1000, () => this.executeAction('REST', true));
        return;
    }

    this.turnState = 'PLAYER';
    this.logBox.log(`It is your turn.`);
    
    // Add these two lines:
    if (this.actionMenu.refresh) this.actionMenu.refresh();
    this.updateActionLabels(); 
}

    private movePlayer(direction: 'LEFT' | 'RIGHT') {
        if (this.turnState !== 'PLAYER') return;
        this.turnState = 'LOCKED';

        const distance = 1 + Math.floor(this.playerState.stats.dexterity / 20);
        const intendedGridX = this.playerEntity.gridX + (direction === 'LEFT' ? -distance : distance);
        const finalGridX = intendedGridX >= this.enemyEntity.gridX ? this.enemyEntity.gridX - 1 : intendedGridX;

        this.logBox.log(`You dashed to the ${direction.toLowerCase()}.`);
        this.playerEntity.animateToGrid(finalGridX, 400, () => this.updateDynamicCamera(0))
            .then(() => this.time.delayedCall(300, () => this.processEnemyTurn()));
    }

    private executeAction(type: 'QUICK' | 'NORMAL' | 'POWER' | 'CHARGE' | 'REST' | 'TAUNT', force: boolean = false) {
        if (this.turnState !== 'PLAYER' && !force) return;
        this.turnState = 'LOCKED';

        const costs = { 'QUICK': 5, 'NORMAL': 10, 'POWER': 20, 'CHARGE': 15, 'REST': 0, 'TAUNT': 0 };
        
        // Stamina Deduction
        if (type !== 'REST' && type !== 'TAUNT') {
            this.playerState.secondaryStats.stamina.current -= costs[type];
            this.playerStaminaBar.update(this.playerState.secondaryStats.stamina.current, this.playerState.secondaryStats.stamina.max);
        }
        
        if (type === 'CHARGE') {
             this.playerEntity.animateToGrid(this.enemyEntity.gridX - 1, 300, () => this.updateDynamicCamera(0))
                .then(() => {
                    const dmg = this.calculateDamage(this.playerState.stats.strength, 'NORMAL');
                    this.applyDamageToEnemy(dmg);
                });
        } // Inside executeAction(), find the 'QUICK', 'NORMAL', 'POWER' section and update it:
else if (['QUICK', 'NORMAL', 'POWER'].includes(type)) {
    // Pass the 'type' string directly to calculateHit
    const hits = this.calculateHit(
        this.playerState.stats.precision, 
        this.enemyTemplate.stats.guard, 
        type as any
    );

    if (hits) {
        const dmg = this.calculateDamage(this.playerState.stats.strength, type as any);
        this.applyDamageToEnemy(dmg);
    } else {
        this.logBox.log(`You missed!`);
        this.showFloatingText(this.enemyEntity.x, this.enemyEntity.y, 'MISS', '#cbd5e1');
        this.time.delayedCall(1000, () => this.processEnemyTurn());
    }
} else if (type === 'REST') {
            this.logBox.log(`You rest and recover stamina.`);
            this.playerState.secondaryStats.stamina.current = Math.min(this.playerState.secondaryStats.stamina.max, this.playerState.secondaryStats.stamina.current + 20);
            this.playerStaminaBar.update(this.playerState.secondaryStats.stamina.current, this.playerState.secondaryStats.stamina.max);
            this.time.delayedCall(1000, () => this.processEnemyTurn());
        }
    }

    private applyDamageToEnemy(damage: number) {
        this.currentEnemyHp = Math.max(0, this.currentEnemyHp - damage);
        this.enemyHpBar.update(this.currentEnemyHp, this.enemyTemplate.baseHp);
        
        this.logBox.log(`Dealt ${damage} damage!`);
        this.showFloatingText(this.enemyEntity.x, this.enemyEntity.y, `-${damage}`, '#ef4444');

        this.enemyEntity.playDamageFlash().then(() => {
            if (this.currentEnemyHp <= 0) {
                this.logBox.log(`Victory! Leaving arena...`);
                // TODO: Sync player Zustand store here! (e.g., usePlayerStore.getState().saveCombatStats(this.playerState))
                this.time.delayedCall(1500, () => {
                    this.cameras.main.fadeOut(250);
                    this.uiCamera.fadeOut(250);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('OpenMap'));
                });
            } else {
                this.time.delayedCall(500, () => this.processEnemyTurn());
            }
        });
    }

    private processEnemyTurn() {
        if (this.currentEnemyHp <= 0) return;
        this.turnState = 'ENEMY';

        if (this.currentEnemyStamina <= 0) {
            this.logBox.log(`${this.enemyIdentity.name} is exhausted and forced to rest!`);
            this.currentEnemyStamina += 20;
            this.enemyStaminaBar.update(this.currentEnemyStamina, this.enemyTemplate.baseStamina);
            this.time.delayedCall(1000, () => this.startPlayerTurn());
            return;
        }

        this.logBox.log(`${this.enemyIdentity.name} makes a move...`);

        this.time.delayedCall(800, () => {
            if (this.getDistance() > 1) {
                this.enemyEntity.animateToGrid(this.enemyEntity.gridX - 1, 400, () => this.updateDynamicCamera(0))
                    .then(() => this.startPlayerTurn());
            } else {
                this.currentEnemyStamina -= 10;
                this.enemyStaminaBar.update(this.currentEnemyStamina, this.enemyTemplate.baseStamina);

                const hits = this.calculateHit(this.enemyTemplate.stats.guard, this.playerState.stats.precision, 'NORMAL');
                if (hits) {
                    const dmg = this.calculateDamage(this.enemyTemplate.stats.strength, 'NORMAL'); 
                    this.applyDamageToPlayer(dmg);
                } else {
                    this.logBox.log(`${this.enemyIdentity.name} swung, but you DODGED!`);
                    this.showFloatingText(this.playerEntity.x, this.playerEntity.y, 'DODGE', '#3b82f6');
                    this.time.delayedCall(1000, () => this.startPlayerTurn());
                }
            }
        });
    }

    private applyDamageToPlayer(damage: number) {
        this.playerState.secondaryStats.hp.current = Math.max(0, this.playerState.secondaryStats.hp.current - damage);
        this.playerHpBar.update(this.playerState.secondaryStats.hp.current, this.playerState.secondaryStats.hp.max);
        
        this.logBox.log(`${this.enemyIdentity.name} hit you for ${damage} damage!`);
        this.showFloatingText(this.playerEntity.x, this.playerEntity.y, `-${damage}`, '#ef4444');

        this.playerEntity.playDamageFlash().then(() => {
            if (this.playerState.secondaryStats.hp.current <= 0) {
                this.turnState = 'LOCKED';
                this.logBox.log(`YOU DIED! Game Over.`);
                // TODO: Handle death state (wipe loot, return to main menu, reset Zustand state)
            } else {
                this.startPlayerTurn();
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