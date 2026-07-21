// src/scenes/CombatScene.ts
import Phaser from 'phaser';
import { type PlayerData } from '../data/PlayerData';
import { type EnemyTemplate } from '../data/Enemy/EnemyArchetypes';
import { generateEnemyIdentity, type EnemyIdentity } from '../data/Enemy/EnemyIdentity';
import { LogBox } from '../components/ui/LogBox';
import { StatBar } from '../components/ui/StatBar';
import { BattleEntity } from '../components/BattleEntity';
import { ActionMenu, type ActionItem } from '../components/ui/ActionMenu';
import { CombatEngine, type AttackType } from '../utils/CombatEngine';
import { ButtonCreator } from '../components/ButtonCreator';

import { usePlayerStore } from '../data/PlayerData';
import { useMapStore } from '../data/MapData';
import { SceneKeys } from '../data/SceneKeys';

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

    private turnState: 'PLAYER' | 'ENEMY' | 'LOCKED' = 'PLAYER';

    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    private uiContainer!: Phaser.GameObjects.Container;

    constructor() {
        super(SceneKeys.CombatScene);
    }

    preload() {
        this.load.image('forest_bg', 'assets/forest_bg.png');
    }

    init(data: CombatPayload) {
        if (!data || !data.enemyTemplate || !data.character) {
            this.scene.start(SceneKeys.OpenMap);
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
            { label: '🏃 CHARGE', description: 'Lunge forward! Range depends on dexterity.', isAttack: true, isDisabled: () => this.getDistance() === 1, action: () => this.executeAction('CHARGE') },
            { label: '💤 REST', description: 'Recover stamina.', isAttack: false, action: () => this.executeAction('REST') }
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
        this.showPreBattleScreen();
    }

    private showPreBattleScreen() {
        const { width, height } = this.scale;
        const vsContainer = this.add.container(0, 0).setDepth(100);
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
        vsContainer.add(bg);

        const titleText = this.add.text(width / 2, 80, "TALE OF THE TAPE", { fontFamily: 'Verdana', fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        const playerText = this.add.text(width / 2 - 200, 150, this.playerState.name.toUpperCase(), { fontFamily: 'Verdana', fontSize: '24px', color: '#3b82f6', fontStyle: 'bold' }).setOrigin(0.5);
        const vsText = this.add.text(width / 2, 150, "VS", { fontFamily: 'Verdana', fontSize: '20px', color: '#7e87a2', fontStyle: 'italic' }).setOrigin(0.5);
        const enemyText = this.add.text(width / 2 + 200, 150, this.enemyTemplate.displayName.toUpperCase(), { fontFamily: 'Verdana', fontSize: '24px', color: '#ef4444', fontStyle: 'bold' }).setOrigin(0.5);

        vsContainer.add([titleText, playerText, vsText, enemyText]);

        const statRows = [
            { label: 'MAX HP', pVal: this.playerState.secondaryStats.hp.max, eVal: this.enemyTemplate.baseHp },
            { label: 'STAMINA', pVal: this.playerState.secondaryStats.stamina.max, eVal: this.enemyTemplate.baseStamina },
            { label: 'STRENGTH', pVal: this.playerState.stats.strength, eVal: this.enemyTemplate.stats.strength },
            { label: 'DEXTERITY', pVal: this.playerState.stats.dexterity, eVal: this.enemyTemplate.stats.dexterity },
            { label: 'PRECISION', pVal: this.playerState.stats.precision, eVal: this.enemyTemplate.stats.precision },
            { label: 'GUARD', pVal: this.playerState.stats.guard, eVal: this.enemyTemplate.stats.guard }
        ];

        let startY = 220;
        const spacing = 45;

        const getComparison = (val1: number, val2: number) => {
            if (val1 > val2) return { symbol: '▲', color: '#10b981' };
            if (val1 < val2) return { symbol: '▼', color: '#ef4444' };
            return { symbol: '-', color: '#fbbf24' };
        };

        statRows.forEach((stat, index) => {
            const y = startY + (index * spacing);
            const labelText = this.add.text(width / 2, y, stat.label, { fontFamily: 'Verdana', fontSize: '18px', color: '#9aa4b2', fontStyle: 'bold' }).setOrigin(0.5);
            const pComp = getComparison(stat.pVal, stat.eVal);
            const eComp = getComparison(stat.eVal, stat.pVal);

            const pValText = this.add.text(width / 2 - 200, y, String(stat.pVal), { fontFamily: 'Verdana', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5);
            const pArrowText = this.add.text(width / 2 - 160, y, pComp.symbol, { fontFamily: 'sans-serif', fontSize: '18px', color: pComp.color }).setOrigin(0.5);
            const eArrowText = this.add.text(width / 2 + 160, y, eComp.symbol, { fontFamily: 'sans-serif', fontSize: '18px', color: eComp.color }).setOrigin(0.5);
            const eValText = this.add.text(width / 2 + 200, y, String(stat.eVal), { fontFamily: 'Verdana', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5);

            vsContainer.add([labelText, pValText, pArrowText, eArrowText, eValText]);
        });

        const fightBtn = ButtonCreator.makeStandardButton(this, "FIGHT!", 200, 60, () => {
            vsContainer.destroy();
            this.startPlayerTurn();
        });

        fightBtn.container.setPosition(width / 2, height - 100);
        vsContainer.add(fightBtn.container);
        this.uiContainer.add(vsContainer);
    }

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

        this.uiCamera.ignore(floatText);
        this.tweens.add({
            targets: floatText, y: y - 120, alpha: 0, duration: 1200, ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy()
        });
    }

    // 🔥 CHANGED: Added CHARGE label at index 5 showing range + whether it will reach
    private updateActionLabels() {
        const prec = this.playerState.stats.precision;
        const guard = this.enemyTemplate.stats.guard;
        const chargeRange = CombatEngine.getChargeRange(this.playerState.stats.dexterity);
        const willReach = this.getDistance() <= chargeRange;

        this.actionMenu.updateLabel(2, `⚡ QUICK (${CombatEngine.getHitChance(prec, guard, 'QUICK')}%)`);
        this.actionMenu.updateLabel(3, `⚔️ NORMAL (${CombatEngine.getHitChance(prec, guard, 'NORMAL')}%)`);
        this.actionMenu.updateLabel(4, `💥 POWER (${CombatEngine.getHitChance(prec, guard, 'POWER')}%)`);
        this.actionMenu.updateLabel(5, `🏃 CHARGE (range: ${chargeRange}) ${willReach ? '✓' : '⚠️'}`);
    }

    private startPlayerTurn() {
        if (this.playerState.secondaryStats.stamina.current <= 0) {
            this.turnState = 'LOCKED';
            this.logBox.log(`You are exhausted! Forced to catch your breath.`);
            this.time.delayedCall(1000, () => this.executeAction('REST', true));
            return;
        }

        this.turnState = 'PLAYER';
        this.logBox.log(`It is your turn.`);
        if (this.actionMenu.refresh) this.actionMenu.refresh();
        this.updateActionLabels();
    }

    private movePlayer(direction: 'LEFT' | 'RIGHT') {
        if (this.turnState !== 'PLAYER') return;

        const dashCost = CombatEngine.getActionCost('MOVE');
        if (this.playerState.secondaryStats.stamina.current < dashCost) {
            this.logBox.log(`Too exhausted to dash!`);
            this.showFloatingText(this.playerEntity.x, this.playerEntity.y, 'TIRED', '#cbd5e1');
            return;
        }

        this.turnState = 'LOCKED';

        this.playerState.secondaryStats.stamina.current -= dashCost;
        this.playerStaminaBar.update(this.playerState.secondaryStats.stamina.current, this.playerState.secondaryStats.stamina.max);

        const distance = 1 + Math.floor(this.playerState.stats.dexterity / 2);
        const intendedGridX = this.playerEntity.gridX + (direction === 'LEFT' ? -distance : distance);
        const MIN_GRID_X = -8;
        const finalGridX = Phaser.Math.Clamp(intendedGridX, MIN_GRID_X, this.enemyEntity.gridX - 1);

        this.logBox.log(`You dashed to the ${direction.toLowerCase()}.`);
        this.playerEntity.animateToGrid(finalGridX, 400, () => this.updateDynamicCamera(0))
            .then(() => this.time.delayedCall(300, () => this.processEnemyTurn()));
    }

    private executeAction(type: string, force: boolean = false) {
        if (this.turnState !== 'PLAYER' && !force) return;
        this.turnState = 'LOCKED';

        const cost = CombatEngine.getActionCost(type);

        if (type !== 'REST') {
            this.playerState.secondaryStats.stamina.current = Math.max(0, this.playerState.secondaryStats.stamina.current - cost);
            this.playerStaminaBar.update(this.playerState.secondaryStats.stamina.current, this.playerState.secondaryStats.stamina.max);
        }

        // 🔥 CHANGED: CHARGE now checks dex-based range — may whiff if too far
        if (type === 'CHARGE') {
            const chargeRange = CombatEngine.getChargeRange(this.playerState.stats.dexterity);
            const distance = this.getDistance();
            const willReach = distance <= chargeRange;

            if (willReach) {
                // Close the gap fully and land a guaranteed hit
                this.playerEntity.animateToGrid(this.enemyEntity.gridX - 1, 300, () => this.updateDynamicCamera(0))
                    .then(() => {
                        // CHARGE deals the same damage as NORMAL — distinction is
                        // purely movement: it closes the gap before hitting
                        const dmg = CombatEngine.calculateDamage(this.playerState.stats.strength, 'NORMAL');
                        this.logBox.log(`You crash into ${this.enemyIdentity.name}!`);
                        this.applyDamageToEnemy(dmg);
                    });
            } else {
                // Lunge falls short — player moves their max range but hits nothing
                const MIN_GRID_X = -8;
                const whiffGridX = Phaser.Math.Clamp(
                    this.playerEntity.gridX + chargeRange,
                    MIN_GRID_X,
                    this.enemyEntity.gridX - 1
                );

                this.playerEntity.animateToGrid(whiffGridX, 300, () => this.updateDynamicCamera(0))
                    .then(() => {
                        this.logBox.log(`You lunged but fell short! You're now exposed.`);
                        this.showFloatingText(this.playerEntity.x, this.playerEntity.y, 'WHIFF', '#cbd5e1');
                        this.time.delayedCall(800, () => this.processEnemyTurn());
                    });
            }
        }
        else if (['QUICK', 'NORMAL', 'POWER'].includes(type)) {
            const hits = CombatEngine.calculateHit(
                this.playerState.stats.precision,
                this.enemyTemplate.stats.guard,
                type as AttackType
            );

            if (hits) {
                const dmg = CombatEngine.calculateDamage(this.playerState.stats.strength, type as AttackType);
                this.applyDamageToEnemy(dmg);
            } else {
                this.logBox.log(`You missed!`);
                this.showFloatingText(this.enemyEntity.x, this.enemyEntity.y, 'MISS', '#cbd5e1');
                this.time.delayedCall(1000, () => this.processEnemyTurn());
            }
        }
        else if (type === 'REST') {
            this.logBox.log(`You rest and recover stamina.`);
            const recovery = CombatEngine.getRestRecovery();

            this.playerState.secondaryStats.stamina.current = Math.min(
                this.playerState.secondaryStats.stamina.max,
                this.playerState.secondaryStats.stamina.current + recovery
            );

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

                usePlayerStore.getState().updateSecondaryStats({
                    hp: this.playerState.secondaryStats.hp,
                    stamina: this.playerState.secondaryStats.stamina
                });

                this.time.delayedCall(1500, () => {
                    this.cameras.main.fadeOut(250);
                    this.uiCamera.fadeOut(250);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SceneKeys.OpenMap));
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

            this.currentEnemyStamina = Math.min(
                this.enemyTemplate.baseStamina,
                this.currentEnemyStamina + CombatEngine.getRestRecovery()
            );

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
                this.currentEnemyStamina = Math.max(0, this.currentEnemyStamina - CombatEngine.getActionCost('NORMAL'));
                this.enemyStaminaBar.update(this.currentEnemyStamina, this.enemyTemplate.baseStamina);

                const hits = CombatEngine.calculateHit(this.enemyTemplate.stats.precision, this.playerState.stats.guard, 'NORMAL');
                if (hits) {
                    const dmg = CombatEngine.calculateDamage(this.enemyTemplate.stats.strength, 'NORMAL');
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
                this.showFloatingText(this.playerEntity.x, this.playerEntity.y, 'DEFEATED', '#7e87a2');

                this.time.delayedCall(2000, () => {
                    this.cameras.main.fadeOut(500);
                    this.uiCamera.fadeOut(500);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        useMapStore.getState().clearMap();
                        this.scene.start(SceneKeys.MainMenu);
                    });
                });
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