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
import type { Equipment, StatModifier } from '../data/Equipment/EquipmentTypes';

import { usePlayerStore } from '../data/PlayerData';
import { useMapStore } from '../data/MapData';
import { SceneKeys } from '../data/SceneKeys';
import { CharacterSheetPanel } from '../components/ui/CharacterSheetPanel';
import { StatCalculator } from '../utils/StatCalculator';

interface CombatPayload {
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

    private bg!: Phaser.GameObjects.TileSprite;

    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    private uiContainer!: Phaser.GameObjects.Container;

    constructor() {
        super(SceneKeys.CombatScene);
    }

    preload() {
        this.load.image('forest_bg', 'assets/forest_bg.png');
    }

    init(data: CombatPayload) {
        if (!data || !data.enemyTemplate) {
            this.scene.start(SceneKeys.OpenMap);
            return;
        }

        // 🔥 CHANGED: always read player from store directly
        // Never trust the passed reference — it may be stale if equipment
        // was changed in RewardScene or stats changed between scenes
        this.playerState = usePlayerStore.getState() as PlayerData;
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
        this.bg = this.add.tileSprite(this.worldCenterX, height * 0.43, 4000, bgTexture.getSourceImage().height * bgScale, 'forest_bg');
        this.bg.setTileScale(bgScale, bgScale).setDepth(-10).setScrollFactor(0);

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

        this.logBox = new LogBox(this, 40, height - 150, width - 80, 130);
        this.uiContainer.add(this.logBox);

        // --- 4. ACTION MENU SETUP ---
        const buttonActions: ActionItem[] = [
            { label: '⬅️', description: 'Move Left — dash to the left.', isAttack: false, action: () => this.movePlayer('LEFT') },
            { label: '➡️', description: 'Move Right — dash to the right.', isAttack: false, action: () => this.movePlayer('RIGHT') },
            { label: '⚡', description: '...', isAttack: true, isDisabled: () => this.getDistance() > 1, action: () => this.executeAction('QUICK') },
            { label: '⚔️', description: '...', isAttack: true, isDisabled: () => this.getDistance() > 1, action: () => this.executeAction('NORMAL') },
            { label: '💥', description: '...', isAttack: true, isDisabled: () => this.getDistance() > 1, action: () => this.executeAction('POWER') },
            { label: '🏃', description: '...', isAttack: true, isDisabled: () => this.getDistance() === 1, action: () => this.executeAction('CHARGE') },
            { label: '💤', description: 'Rest — recover stamina.', isAttack: false, action: () => this.executeAction('REST') }
        ];

        this.actionMenu = new ActionMenu(
            this, this.worldCenterX, height - 195, buttonActions,
            (desc) => this.logBox.showTooltip(desc),
            () => this.logBox.clearTooltip()
        );
        this.uiContainer.add(this.actionMenu);

        CharacterSheetPanel.createButton(
            this,
            this.playerState,
            this.worldCenterX + this.actionMenu.getRightEdgeX() + 18 + 30,
            height - 195,
            this.uiContainer
        );

        // --- 5. CAMERA SETUP ---
        this.uiCamera = this.cameras.add(0, 0, width, height);
        this.cameras.main.ignore(this.uiContainer);

        for (const obj of this.children.list) {
            if (obj !== this.uiContainer) this.uiCamera.ignore(obj);
        }

        this.updateDynamicCamera(0);
        this.showPreBattleScreen();
    }

    update() {
        if (this.bg) {
            this.bg.tilePositionX = this.cameras.main.scrollX * 0.5;
        }
    }

    private warnIfUnderequipped(): number {
        const weapon = this.playerState.equipment?.weapon;
        if (!weapon) return 0;

        const penalty = StatCalculator.getRequirementPenalty(this.playerState, weapon);
        if (penalty > 0) {
            const shortfall = StatCalculator.getRequirementShortfall(this.playerState, weapon);
            this.logBox.log(
                `You struggle with the ${weapon.name}! ` +
                `(-${penalty} stamina, need ${weapon.requirement!.value} ` +
                `${weapon.requirement!.stat}, have ${weapon.requirement!.value - shortfall})`
            );
        }
        return penalty;
    }

    private showPreBattleScreen() {
        const { width, height } = this.scale;
        const vsContainer = this.add.container(0, 0).setDepth(100);
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
        vsContainer.add(bg);

        // --- TITLE ---
        vsContainer.add(
            this.add.text(width / 2, 50, 'TALE OF THE TAPE', {
                fontFamily: 'Verdana', fontSize: '32px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5)
        );

        // --- NAMES ---
        vsContainer.add([
            this.add.text(width / 2 - 220, 100, this.playerState.name.toUpperCase(), {
                fontFamily: 'Verdana', fontSize: '20px', color: '#3b82f6', fontStyle: 'bold'
            }).setOrigin(0.5),
            this.add.text(width / 2, 100, 'VS', {
                fontFamily: 'Verdana', fontSize: '16px', color: '#7e87a2', fontStyle: 'italic'
            }).setOrigin(0.5),
            this.add.text(width / 2 + 220, 100, this.enemyTemplate.displayName.toUpperCase(), {
                fontFamily: 'Verdana', fontSize: '20px', color: '#ef4444', fontStyle: 'bold',
                wordWrap: { width: 260 }, align: 'center'
            }).setOrigin(0.5)
        ]);

        // --- SECTION HEADER HELPER ---
        const addSectionHeader = (label: string, y: number) => {
            vsContainer.add(
                this.add.text(width / 2, y, label, {
                    fontFamily: 'Verdana', fontSize: '11px',
                    color: '#4b5563', letterSpacing: 3
                }).setOrigin(0.5)
            );
        };

        // --- EFFECTIVE PLAYER STATS ---
        // 🔥 CHANGED: use effective stats so equipment bonuses are reflected
        const effective = StatCalculator.getEffectiveStats(this.playerState);
        const effectiveMaxHp = StatCalculator.getEffectiveMaxHp(this.playerState);
        const effectiveMaxStamina = StatCalculator.getEffectiveMaxStamina(this.playerState);

        const statRows = [
            { label: 'MAX HP', pVal: effectiveMaxHp, eVal: this.enemyTemplate.baseHp },
            { label: 'STAMINA', pVal: effectiveMaxStamina, eVal: this.enemyTemplate.baseStamina },
            { label: 'STRENGTH', pVal: effective['strength'] ?? 0, eVal: this.enemyTemplate.stats.strength },
            { label: 'DEXTERITY', pVal: effective['dexterity'] ?? 0, eVal: this.enemyTemplate.stats.dexterity },
            { label: 'PRECISION', pVal: effective['precision'] ?? 0, eVal: this.enemyTemplate.stats.precision },
            { label: 'GUARD', pVal: effective['guard'] ?? 0, eVal: this.enemyTemplate.stats.guard }
        ];

        addSectionHeader('— STATS —', 135);

        const statStartY = 162;
        const statSpacing = 38;

        const getComparison = (val1: number, val2: number) => {
            if (val1 > val2) return { symbol: '▲', color: '#10b981' };
            if (val1 < val2) return { symbol: '▼', color: '#ef4444' };
            return { symbol: '-', color: '#fbbf24' };
        };

        statRows.forEach((stat, index) => {
            const y = statStartY + (index * statSpacing);
            const pComp = getComparison(stat.pVal, stat.eVal);
            const eComp = getComparison(stat.eVal, stat.pVal);

            vsContainer.add([
                this.add.text(width / 2, y, stat.label, {
                    fontFamily: 'Verdana', fontSize: '15px', color: '#9aa4b2', fontStyle: 'bold'
                }).setOrigin(0.5),
                this.add.text(width / 2 - 195, y, String(stat.pVal), {
                    fontFamily: 'Verdana', fontSize: '17px', color: '#ffffff', fontStyle: 'bold'
                }).setOrigin(1, 0.5),
                this.add.text(width / 2 - 165, y, pComp.symbol, {
                    fontFamily: 'sans-serif', fontSize: '15px', color: pComp.color
                }).setOrigin(0.5),
                this.add.text(width / 2 + 165, y, eComp.symbol, {
                    fontFamily: 'sans-serif', fontSize: '15px', color: eComp.color
                }).setOrigin(0.5),
                this.add.text(width / 2 + 195, y, String(stat.eVal), {
                    fontFamily: 'Verdana', fontSize: '17px', color: '#ffffff', fontStyle: 'bold'
                }).setOrigin(0, 0.5)
            ]);
        });

        // --- EQUIPMENT SECTION ---
        // 🔥 NEW: shows equipment for both sides — enemy equipment shows None until implemented
        const equipStartY = statStartY + (statRows.length * statSpacing) + 16;
        addSectionHeader('— EQUIPMENT —', equipStartY);

        const playerEquip = this.playerState.equipment ?? { weapon: null, shield: null, accessory: null };
        const enemyEquip = this.enemyTemplate.equipment ?? {};

        const equipRows = [
            {
                icon: '⚔️',
                label: 'WEAPON',
                pItem: playerEquip.weapon ?? null,
                eItem: enemyEquip.weapon ?? null
            },
            {
                icon: '🛡️',
                label: 'SHIELD',
                pItem: playerEquip.shield ?? null,
                eItem: enemyEquip.shield ?? null
            },
            {
                icon: '💍',
                label: 'ACCESSORY',
                pItem: playerEquip.accessory ?? null,
                eItem: enemyEquip.accessory ?? null
            }
        ];

        const equipY = equipStartY + 26;
        const equipSpacing = 30;

        const infoBoxX = 40;
        const infoBoxY = height - 220;
        const infoBoxW = 280;
        const infoBoxH = 120;

        const infoBoxBg = this.add.rectangle(infoBoxX, infoBoxY, infoBoxW, infoBoxH, 0x0a1128)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x1e293b)
            .setAlpha(0); // hidden until hover

        const infoBoxText = this.add.text(infoBoxX + 10, infoBoxY + 10, '', {
            fontFamily: 'Verdana',
            fontSize: '11px',
            color: '#94a3b8',
            wordWrap: { width: infoBoxW - 20 },
            lineSpacing: 4
        }).setAlpha(0);

        vsContainer.add([infoBoxBg, infoBoxText]);

        // Helper — shows and populates the info box
        const showItemInfo = (item: Equipment | null, side: 'player' | 'enemy') => {
            if (!item) return;

            const sideColor = side === 'player' ? '#60a5fa' : '#f87171';
            const modLines = item.modifiers
                .map((m: StatModifier) => `${m.value > 0 ? '+' : ''}${m.value} ${m.stat}`)
                .join('   ');
            const reqLine = item.requirement
                ? `Requires ${item.requirement.stat} ${item.requirement.value}`
                : '';

            const lines = [
                item.name,
                item.description,
                '',
                modLines,
                reqLine
            ].filter(Boolean).join('\n');

            infoBoxText.setText(lines).setColor(sideColor).setAlpha(1);
            infoBoxBg.setAlpha(1);
        };

        const hideItemInfo = () => {
            infoBoxBg.setAlpha(0);
            infoBoxText.setAlpha(0);
        };

        equipRows.forEach((row, index) => {
            const y = equipY + (index * equipSpacing);
            const pName = row.pItem ? row.pItem.name : 'None';
            const eName = row.eItem ? row.eItem.name : 'None';
            const pColor = row.pItem ? '#60a5fa' : '#374151';
            const eColor = row.eItem ? '#f87171' : '#374151';

            // Player item text
            const pText = this.add.text(width / 2 - 180, y, pName, {
                fontFamily: 'Verdana', fontSize: '13px',
                color: pColor, fontStyle: row.pItem ? 'bold' : 'normal'
            }).setOrigin(1, 0.5);

            // Center label
            const centerLabel = this.add.text(width / 2, y, `${row.icon} ${row.label}`, {
                fontFamily: 'Verdana', fontSize: '12px', color: '#4b5563'
            }).setOrigin(0.5);

            // Enemy item text
            const eText = this.add.text(width / 2 + 180, y, eName, {
                fontFamily: 'Verdana', fontSize: '13px',
                color: eColor, fontStyle: row.eItem ? 'bold' : 'normal'
            }).setOrigin(0, 0.5);

            // 🔥 Hover only on equipped items
            if (row.pItem) {
                pText.setInteractive({ useHandCursor: true });
                pText.on('pointerover', () => {
                    pText.setColor('#93c5fd'); // lighten on hover
                    showItemInfo(row.pItem, 'player');
                });
                pText.on('pointerout', () => {
                    pText.setColor(pColor);
                    hideItemInfo();
                });
            }

            if (row.eItem) {
                eText.setInteractive({ useHandCursor: true });
                eText.on('pointerover', () => {
                    eText.setColor('#fca5a5'); // lighten on hover
                    showItemInfo(row.eItem, 'enemy');
                });
                eText.on('pointerout', () => {
                    eText.setColor(eColor);
                    hideItemInfo();
                });
            }

            vsContainer.add([pText, centerLabel, eText]);
        });

        // --- FIGHT BUTTON ---
        const fightBtn = ButtonCreator.makeStandardButton(this, 'FIGHT!', 200, 60, () => {
            vsContainer.destroy();
            this.startPlayerTurn();
        });
        fightBtn.container.setPosition(width / 2, height - 80);
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
            fontFamily: 'sans-serif', fontSize: '26px', color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        this.uiCamera.ignore(floatText);
        this.tweens.add({
            targets: floatText, y: y - 120, alpha: 0, duration: 1200, ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy()
        });
    }

    private updateActionLabels() {
        // 🔥 CHANGED: use effective stats so equipment bonuses apply to hit chance display
        const effective = StatCalculator.getEffectiveStats(this.playerState);
        const prec = effective.precision;  // was: this.playerState.stats.precision
        const guard = this.enemyTemplate.stats.guard;
        const chargeRange = CombatEngine.getChargeRange(effective.dexterity); // was: playerState.stats.dexterity
        const willReach = this.getDistance() <= chargeRange;

        this.actionMenu.updateDescription(2, `Quick Strike — fast, lower damage. Hit chance: ${CombatEngine.getHitChance(prec, guard, 'QUICK')}%`);
        this.actionMenu.updateDescription(3, `Normal Strike — balanced attack. Hit chance: ${CombatEngine.getHitChance(prec, guard, 'NORMAL')}%`);
        this.actionMenu.updateDescription(4, `Power Strike — slow, high damage. Hit chance: ${CombatEngine.getHitChance(prec, guard, 'POWER')}%`);
        this.actionMenu.updateDescription(5, `Charge — lunge forward. Range: ${chargeRange} ${willReach ? '(will reach ✓)' : '(too far ⚠️)'}`);
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

        // 🔥 CHANGED: dexterity read through effective stats
        const effective = StatCalculator.getEffectiveStats(this.playerState);
        const distance = 1 + Math.floor(effective.dexterity / 2); // was: playerState.stats.dexterity
        const intendedGridX = this.playerEntity.gridX + (direction === 'LEFT' ? -distance : distance);
        const MIN_GRID_X = -8;
        const finalGridX = Phaser.Math.Clamp(intendedGridX, MIN_GRID_X, this.enemyEntity.gridX - 1);

        this.logBox.log(`You dashed to the ${direction.toLowerCase()}.`);
        this.playerEntity.animateToGrid(finalGridX, 400, () => this.updateDynamicCamera(0))
            .then(() => this.time.delayedCall(300, () => this.processEnemyTurn()));
    }

    // 🔥 NEW: helper so damage resolution isn't repeated in every attack branch
    private resolvePlayerDamage(type: AttackType): number {
        const effectiveStats = StatCalculator.getEffectiveStats(this.playerState);
        const scalingValue = StatCalculator.resolveScalingStat(
            this.playerState.equipment?.weapon?.scalingStat,
            effectiveStats
        );
        const weaponBase = this.playerState.equipment?.weapon?.baseDamage;
        return CombatEngine.calculateDamage(type, scalingValue, weaponBase);
    }

    private executeAction(type: string, force: boolean = false) {
        if (this.turnState !== 'PLAYER' && !force) return;
        this.turnState = 'LOCKED';

        const cost = CombatEngine.getActionCost(type);

        if (type !== 'REST') {
            // 🔥 CHANGED: base cost + requirement penalty for attack actions
            const penalty = ['QUICK', 'NORMAL', 'POWER', 'CHARGE'].includes(type)
                ? this.warnIfUnderequipped()
                : 0;

            this.playerState.secondaryStats.stamina.current = Math.max(
                0,
                this.playerState.secondaryStats.stamina.current - cost - penalty
            );
            this.playerStaminaBar.update(
                this.playerState.secondaryStats.stamina.current,
                this.playerState.secondaryStats.stamina.max
            );
        }

        if (type === 'CHARGE') {
            const effective = StatCalculator.getEffectiveStats(this.playerState);
            const chargeRange = CombatEngine.getChargeRange(effective.dexterity);
            const distance = this.getDistance();
            const willReach = distance <= chargeRange;

            if (willReach) {
                this.playerEntity.animateToGrid(this.enemyEntity.gridX - 1, 300, () => this.updateDynamicCamera(0))
                    .then(() => {
                        const dmg = this.resolvePlayerDamage('NORMAL');
                        this.logBox.log(`You crash into ${this.enemyIdentity.name}!`);
                        this.applyDamageToEnemy(dmg);
                    });
            } else {
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
                        this.time.delayedCall(300, () => this.processEnemyTurn());
                    });
            }
        }
        else if (['QUICK', 'NORMAL', 'POWER'].includes(type)) {
            // 🔥 FIXED: use effective precision so equipment bonuses actually apply
            const effective = StatCalculator.getEffectiveStats(this.playerState);
            const hits = CombatEngine.calculateHit(
                effective.precision,            // was: this.playerState.stats.precision
                this.enemyTemplate.stats.guard,
                type as AttackType
            );

            if (hits) {
                const dmg = this.resolvePlayerDamage(type as AttackType);
                this.applyDamageToEnemy(dmg);
            } else {
                this.logBox.log(`You missed!`);
                this.showFloatingText(this.enemyEntity.x, this.enemyEntity.y, 'MISS', '#cbd5e1');
                this.time.delayedCall(300, () => this.processEnemyTurn());
            }
        }
        else if (type === 'REST') {
            this.logBox.log(`You rest and recover stamina.`);
            const recovery = CombatEngine.getRestRecovery();
            this.playerState.secondaryStats.stamina.current = Math.min(
                this.playerState.secondaryStats.stamina.max,
                this.playerState.secondaryStats.stamina.current + recovery
            );
            this.playerStaminaBar.update(
                this.playerState.secondaryStats.stamina.current,
                this.playerState.secondaryStats.stamina.max
            );
            this.time.delayedCall(300, () => this.processEnemyTurn());
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
                this.time.delayedCall(1000, () => {
                    this.cameras.main.fadeOut(250);
                    this.uiCamera.fadeOut(250);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start(SceneKeys.RewardScene, { enemyTemplate: this.enemyTemplate });
                    });
                });
            } else {
                this.time.delayedCall(300, () => this.processEnemyTurn());
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
            this.time.delayedCall(300, () => this.startPlayerTurn());
            return;
        }

        this.logBox.log(`${this.enemyIdentity.name} makes a move...`);

        this.time.delayedCall(300, () => {
            if (this.getDistance() > 1) {
                this.enemyEntity.animateToGrid(this.enemyEntity.gridX - 1, 250, () => this.updateDynamicCamera(0))
                    .then(() => this.startPlayerTurn());
            } else {
                this.currentEnemyStamina = Math.max(0, this.currentEnemyStamina - CombatEngine.getActionCost('NORMAL'));
                this.enemyStaminaBar.update(this.currentEnemyStamina, this.enemyTemplate.baseStamina);

                // 🔥 CHANGED: player guard now reads through effective stats
                const effective = StatCalculator.getEffectiveStats(this.playerState);
                const hits = CombatEngine.calculateHit(
                    this.enemyTemplate.stats.precision,
                    effective.guard, // was: this.playerState.stats.guard
                    'NORMAL'
                );

                if (hits) {
                    const dmg = CombatEngine.calculateDamage(
                        'NORMAL',
                        this.enemyTemplate.stats.strength,
                        undefined
                    );
                    this.applyDamageToPlayer(dmg);
                } else {
                    this.logBox.log(`${this.enemyIdentity.name} swung, but you DODGED!`);
                    this.showFloatingText(this.playerEntity.x, this.playerEntity.y, 'DODGE', '#3b82f6');
                    this.time.delayedCall(300, () => this.startPlayerTurn());
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