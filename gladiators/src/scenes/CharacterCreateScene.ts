import Phaser from 'phaser';
import { faker } from '@faker-js/faker';
import { ButtonCreator } from '../components/ButtonCreator';
import { ColorPicker } from '../components/ColorPicker';
import { Stickman } from '../components/Stickman';
import { GameConfig } from '../data/GameConfig';

import { SceneKeys } from '../data/SceneKeys';

// NEW: Import the types and the setter function from your new file
import { type StatKey, type Expression, setPlayerData } from '../data/playerData';


export default class CharacterCreateScene extends Phaser.Scene {
    constructor() { super(SceneKeys.CharacterCreate); }

    // ---------- STATE ----------
    private readonly FREE_POINTS: number = GameConfig.CHARACTER.STARTING_POINTS;
    private pointsRemaining: number = this.FREE_POINTS;
    private stats: Record<StatKey, number> = {
        strength: GameConfig.CHARACTER.MIN_STAT_VALUE,
        dexterity: GameConfig.CHARACTER.MIN_STAT_VALUE,
        precision: GameConfig.CHARACTER.MIN_STAT_VALUE,
        guard: GameConfig.CHARACTER.MIN_STAT_VALUE,
        vitality: GameConfig.CHARACTER.MIN_STAT_VALUE,
        arcane: GameConfig.CHARACTER.MIN_STAT_VALUE
    };

    private nameValue = '';
    private currentSkinColor = 0x3498db; 
    private currentExpression: Expression = 'poker';

    private BANNED_WORDS: string[] = [];
    private readonly DUMMY_NAMES = ["The Bad Mouth", "Silly Goose", "Keyboard Masher", "Default Dave", "Mr. No-Name", "Lord Fluffbottom"];

    private readonly faceMoods: Expression[] = [
        'poker', 'happy', 'sad', 'angry', 'wink', 
        'determined', 'battle_cry', 'smirk', 'fearful', 'nervous'
    ];
    
    private readonly faceGlyphs = [
        '😐', '😊', '😓', '😠', '😉',
        '🥺', '🤨', '😵', '😮', '😖'
    ];

    // UI Refs
    private nameInput?: Phaser.GameObjects.DOMElement;
    private nameErrorText?: Phaser.GameObjects.Text;
    private pointsText?: Phaser.GameObjects.Text;
    private descText?: Phaser.GameObjects.Text;
    private statTexts: Partial<Record<StatKey, Phaser.GameObjects.Text>> = {};
    private plusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};
    private minusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};
    private confirmBtn?: Phaser.GameObjects.Container;
    private stickman?: Stickman;
    private secondaryStatTexts: Record<string, Phaser.GameObjects.Text> = {};
    private expressionButtons: Phaser.GameObjects.Container[] = [];

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x0b0f1a);

        const bannedWordsText = this.cache.text.get('bannedWords');
        if (bannedWordsText) {
            this.BANNED_WORDS = bannedWordsText.split('\n').map((w: string) => w.trim().toLowerCase()).filter((w: string) => w.length > 0);
        }

        const margin = 20;
        const nameH = 80; 
        const leftColW = Math.floor(width * 0.32);
        const colRightX = leftColW + 110; 
        const colRightW = width - colRightX - margin;
        const halfW = colRightW / 2;
        const previewH = height - margin * 2;

        const namePanel = this.createPanel(margin, margin, leftColW, nameH, "NAME");
        const skillPanelY = nameH + margin * 2;
        const skillPanelH = height - skillPanelY - margin;
        const skillPanel = this.createPanel(margin, skillPanelY, leftColW, skillPanelH, "SKILL ALLOCATION");
        this.createPanel(colRightX, margin, halfW - 10, previewH, "PREVIEW");
        const settingsPanelW = halfW - 10;
        const settingsPanel = this.createPanel(colRightX + halfW + 5, margin, settingsPanelW, height - margin * 2, "SETTINGS");

        const cursorTooltip = this.add.text(0, 0, "Randomize\nCharacter", {
            fontSize: '12px', backgroundColor: '#000000', color: '#ffffff', padding: { x: 8, y: 4 }, fontFamily: 'Verdana'
        }).setOrigin(0).setDepth(100).setAlpha(0);

        const randomizeBtn = ButtonCreator.makeTransparentIconButton(this, settingsPanelW - 55, 45, '🎲', '40px', cursorTooltip, () => { this.randomizeAll(); });
        settingsPanel.add(randomizeBtn);

        const resetTooltip = this.add.text(0, 0, "Reset\nCharacter", {
            fontSize: '12px', backgroundColor: '#000000', color: '#ffffff', padding: { x: 8, y: 4 }, fontFamily: 'Verdana'
        }).setOrigin(0).setDepth(100).setAlpha(0);

        const resetBtn = ButtonCreator.makeTransparentIconButton(this, settingsPanelW - 55 - 50, 45, '↻', '40px', resetTooltip, () => { this.resetAll(); });
        settingsPanel.add(resetBtn);

        const inputW = leftColW - 40;
        const inputH = 30;
        const inputStyle = `width:${inputW}px; height:${inputH}px; background:#0f1422; color:#fff; border:1px solid #22304c; padding:0 8px; font-family:Verdana; outline:none;`;
        this.nameInput = this.add.dom(leftColW / 2, (nameH / 2), 'input', inputStyle);
        const el = this.nameInput.node as HTMLInputElement;
        el.maxLength = 40; 
        el.placeholder = "Enter Name...";

        this.nameErrorText = this.add.text(leftColW / 2, nameH - 12, '', { fontSize: '10px', color: '#ff4d4d', fontStyle: 'bold' }).setOrigin(0.5);
        namePanel.add([this.nameInput, this.nameErrorText]);

        this.nameInput.addListener('input').on('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const filtered = target.value.replace(/[^a-zA-Z ]/g, '');
            target.value = filtered;
            this.nameValue = filtered;
            this.updateButtons();
        });

        const pBoxSize = 60;
        const pPanel = this.add.container(leftColW - pBoxSize - 10, 30);
        pPanel.add(this.add.rectangle(0, 0, pBoxSize, pBoxSize, 0x141a2a).setOrigin(0).setStrokeStyle(2, 0x22304c));
        this.pointsText = this.add.text(pBoxSize/2, pBoxSize/2, '9', {fontSize: '32px', color: '#e2c16b', fontFamily:'Georgia'}).setOrigin(0.5);
        pPanel.add(this.pointsText);
        skillPanel.add(pPanel);

        const descBoxH = 100;
        const descBoxY = skillPanelH - descBoxH - 15;
        skillPanel.add(this.add.rectangle(10, descBoxY, leftColW - 20, descBoxH, 0x0f1422).setOrigin(0).setStrokeStyle(1, 0x22304c));
        this.descText = this.add.text(20, descBoxY + 10, "Hover over a stat to see details.", {
            fontSize: '13px', color: '#9aa4b2', wordWrap: { width: leftColW - 40 }, lineSpacing: 4
        }).setOrigin(0);
        skillPanel.add(this.descText);

        const statDescriptions: Record<StatKey, string> = {
            strength: "Increases base and sword damage, improves shove strength and resistance, and lets you use more melee weapons (except daggers). You also look bigger!",
            dexterity: "Increases dagger and bow damage, improves speed and movement, and lets you use daggers and bows.",
            precision: "Increases the chance to land hits and deal critical strikes.",
            guard: "Increases the chance to block and parry attacks.",
            vitality: "Increases total health and stamina.",
            arcane: "Unlocks spells and potions while boosting spell power."
        };

        const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
        const controlX = leftColW - 60; 
        statKeys.forEach((key, i) => {
            const y = 110 + (i * 45); 
            const label = this.add.text(20, y, key.toUpperCase(), { fontSize: '13px', color: '#9aa4b2' }).setInteractive({ useHandCursor: true });
            label.on('pointerover', () => { label.setColor('#fff'); if(this.descText) this.descText.setText(statDescriptions[key]); });
            label.on('pointerout', () => { label.setColor('#9aa4b2'); if(this.descText) this.descText.setText("Hover over a stat to see details."); });

            skillPanel.add(label);
            const valText = this.add.text(controlX, y + 8, GameConfig.CHARACTER.MIN_STAT_VALUE.toString(), { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            const minus = ButtonCreator.makeIconButton(this, controlX - 49, y - 4, '–', () => this.decStat(key));
            const plus = ButtonCreator.makeIconButton(this, controlX + 21, y - 4, '+', () => this.incStat(key));
            this.statTexts[key] = valText;
            this.minusButtons[key] = minus; 
            this.plusButtons[key] = plus;
            skillPanel.add([minus, valText, plus]);
        });

        settingsPanel.add(this.add.text(20, 80, 'BODY COLOR PALETTE', {fontSize:'14px', color:'#9aa4b2', fontStyle:'bold'}));
        const pickerSize = settingsPanelW * 0.7;
        new ColorPicker(this, 20, 110, pickerSize, (c) => { this.currentSkinColor = c; this.redrawStickman(); }, settingsPanel);

        // Expression Buttons: Now a 5x2 grid for 10 emojis
        settingsPanel.add(this.add.text(20, pickerSize + 130, 'FACIAL EXPRESSION', { fontSize: '14px', color: '#9aa4b2', fontStyle: 'bold' }));
        
        const cols = 5;
        this.faceMoods.forEach((mood, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = 32 + (col * 42); 
            const y = pickerSize + 175 + (row * 50);
            
            const btn = ButtonCreator.makeRoundButton(this, x, y, 20, 0x1c2740, this.faceGlyphs[i], () => {
                this.currentExpression = mood;
                this.redrawStickman();
                this.expressionButtons.forEach(b => b.setAlpha(0.4));
                btn.setAlpha(1);
            });
            btn.setAlpha(mood === this.currentExpression ? 1 : 0.4);
            this.expressionButtons.push(btn);
            settingsPanel.add(btn);
        });

        this.confirmBtn = ButtonCreator.makeRoundButton(this, width - 60, height - 60, 30, 0x12a150, '✓', () => {
            const trimmedName = this.nameValue.trim();
            if (trimmedName === "") {
                this.nameValue = "Nameless";
                if (this.nameInput) (this.nameInput.node as HTMLInputElement).value = "Nameless";
            } else {
                const nameStatus = this.validateName(this.nameValue);
                if (!nameStatus.valid) {
                    const dummyName = Phaser.Utils.Array.GetRandom(this.DUMMY_NAMES);
                    this.nameValue = dummyName;
                    if (this.nameInput) (this.nameInput.node as HTMLInputElement).value = dummyName;
                    if (this.nameErrorText) {
                        this.nameErrorText.setText("I WARNED YOU!!");
                        this.time.delayedCall(3000, () => { if(this.nameErrorText) this.nameErrorText.setText(''); });
                    }
                }
            }

            // Calculate secondary stats
            const hp = GameConfig.SCALING.HP_BASE + (this.stats.vitality * GameConfig.SCALING.HP_PER_VITALITY);
            const mp = GameConfig.SCALING.MP_BASE + (this.stats.arcane * GameConfig.SCALING.MP_PER_ARCANE);
            const speed = GameConfig.SCALING.SPEED_BASE + (this.stats.dexterity * GameConfig.SCALING.SPEED_PER_DEXTERITY);
            const block = this.stats.guard * GameConfig.SCALING.BLOCK_PER_GUARD;
            const hitChance = this.stats.precision * GameConfig.SCALING.HIT_CHANCE_PER_PRECISION;
            const crit = (this.stats.precision - 1) * GameConfig.SCALING.CRIT_CHANCE_MODIFIER;

            // Prepare character data
            const characterData = {
                name: this.nameValue,
                appearance: {
                    skinColor: this.currentSkinColor,
                    hairColor: 0x8B4513, // Default brown hair
                    hairStyle: 1, // Default style
                    expression: this.currentExpression
                },
                stats: { ...this.stats },
                secondaryStats: {
                    hp,
                    mp,
                    atk: { min: this.stats.strength, max: this.stats.strength + GameConfig.SCALING.ATK_RANGE_BONUS },
                    speed,
                    block,
                    hitChance,
                    crit
                }
            };

            setPlayerData(characterData); // Save to global player data

            // Navigate to OpenMap with character data
            this.scene.start(SceneKeys.OpenMap, { character: characterData });
        });

        ButtonCreator.makeRoundButton(this, width - 130, height - 60, 30, 0xaa3d3d, '✗', () => this.scene.start(SceneKeys.MainMenu));

        this.stickman = new Stickman(
            this, 
            colRightX + (halfW - 10) / 2, 
            margin + (previewH) * 0.37, 
            this.currentSkinColor, 
            this.currentExpression
        );
       

        const previewPanelLeft = colRightX + 20;
        const previewPanelRight = colRightX + (halfW - 10) / 2 + 10;
        const statsBaseY = margin + (previewH) * 0.65;
        const statStyle = { fontSize: '13px', color: '#e2c16b', fontFamily: 'Verdana' };

        this.secondaryStatTexts.hp = this.add.text(previewPanelLeft, statsBaseY, 'HP: 0', statStyle);
        this.secondaryStatTexts.mp = this.add.text(previewPanelLeft, statsBaseY + 35, 'MP: 0', statStyle);
        this.secondaryStatTexts.atk = this.add.text(previewPanelLeft, statsBaseY + 70, 'ATK: 0', statStyle);
        this.secondaryStatTexts.speed = this.add.text(previewPanelRight, statsBaseY, 'SPD: 0', statStyle);
        this.secondaryStatTexts.block = this.add.text(previewPanelRight, statsBaseY + 35, 'BLK: 0', statStyle);
        this.secondaryStatTexts.hit = this.add.text(previewPanelRight, statsBaseY + 70, 'HIT: 0', statStyle);
        this.secondaryStatTexts.crit = this.add.text(previewPanelRight, statsBaseY + 105, 'CRT: 0', statStyle);

        this.refreshStatsUI();
        this.redrawStickman();
    }

    private redrawStickman() {
    this.stickman?.updateAppearance(this.currentSkinColor, this.currentExpression);
}

    private randomizeAll() {
        const randomName = this.generateVikingName();
        this.nameValue = randomName;
        if (this.nameInput) (this.nameInput.node as HTMLInputElement).value = randomName;
        this.currentSkinColor = Math.floor(Math.random() * 0xffffff);
        this.currentExpression = Phaser.Utils.Array.GetRandom(this.faceMoods);
        const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
        statKeys.forEach(k => this.stats[k] = GameConfig.CHARACTER.MIN_STAT_VALUE);
        this.pointsRemaining = GameConfig.CHARACTER.STARTING_POINTS;
        while (this.pointsRemaining > 0) {
            this.stats[Phaser.Utils.Array.GetRandom(statKeys)]++;
            this.pointsRemaining--;
        }
        this.expressionButtons.forEach((btn, i) => btn.setAlpha(this.faceMoods[i] === this.currentExpression ? 1 : 0.4));
        this.refreshStatsUI();
        this.redrawStickman();
    }

    private resetAll() {
        this.nameValue = '';
        if (this.nameInput) (this.nameInput.node as HTMLInputElement).value = '';
        this.currentSkinColor = GameConfig.CHARACTER.DEFAULT_SKIN_COLOR;
        this.currentExpression = 'poker';
        const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
        statKeys.forEach(k => this.stats[k] = GameConfig.CHARACTER.MIN_STAT_VALUE);
        this.pointsRemaining = GameConfig.CHARACTER.STARTING_POINTS;
        this.expressionButtons.forEach((btn, i) => btn.setAlpha(i === 0 ? 1 : 0.4));
        this.refreshStatsUI();
        this.redrawStickman();
    }

    private validateName(name: string): { valid: boolean; error: string } {
        if (this.BANNED_WORDS.some(w => name.toLowerCase().includes(w))) return { valid: false, error: "BANNED WORD" };
        return { valid: true, error: "" };
    }

    private updateButtons() {
        const nameStatus = this.validateName(this.nameValue);
        if (this.nameErrorText) this.nameErrorText.setText(nameStatus.error);
        const canAdd = this.pointsRemaining > 0;
        (Object.keys(this.stats) as StatKey[]).forEach(k => {
            if(this.plusButtons[k]) ButtonCreator.setButtonEnabled(this.plusButtons[k]!, canAdd);
            if(this.minusButtons[k]) ButtonCreator.setButtonEnabled(this.minusButtons[k]!, this.stats[k] > GameConfig.CHARACTER.MIN_STAT_VALUE);
        });
        if(this.confirmBtn) ButtonCreator.setButtonEnabled(this.confirmBtn, this.pointsRemaining === 0);
    }

    private createPanel(x: number, y: number, w: number, h: number, title: string) {
        const c = this.add.container(x, y);
        c.add(this.add.rectangle(0, 0, w, h, 0x141a2a, 0.85).setOrigin(0).setStrokeStyle(2, 0x22304c));
        c.add(this.add.text(15, 10, title, { fontSize: '11px', color: '#5c6a7e', fontStyle: 'bold' }));
        return c;
    }

    private incStat(key: StatKey) { if(this.pointsRemaining > 0) { this.stats[key]++; this.pointsRemaining--; this.refreshStatsUI(); } }
    private decStat(key: StatKey) { if(this.stats[key] > GameConfig.CHARACTER.MIN_STAT_VALUE) { this.stats[key]--; this.pointsRemaining++; this.refreshStatsUI(); } }
    
    private refreshStatsUI() {
        (Object.keys(this.stats) as StatKey[]).forEach(k => { if(this.statTexts[k]) this.statTexts[k]!.setText(String(this.stats[k])); });
        if(this.pointsText) this.pointsText.setText(String(this.pointsRemaining));
        const hp = GameConfig.SCALING.HP_BASE + (this.stats.vitality * GameConfig.SCALING.HP_PER_VITALITY);
        const mp = GameConfig.SCALING.MP_BASE + (this.stats.arcane * GameConfig.SCALING.MP_PER_ARCANE);
        const speed = GameConfig.SCALING.SPEED_BASE + (this.stats.dexterity * GameConfig.SCALING.SPEED_PER_DEXTERITY);
        const block = this.stats.guard * GameConfig.SCALING.BLOCK_PER_GUARD;
        const hitChance = this.stats.precision * GameConfig.SCALING.HIT_CHANCE_PER_PRECISION;
        const crit = ((this.stats.precision - 1) * GameConfig.SCALING.CRIT_CHANCE_MODIFIER).toFixed(1);
        if (this.secondaryStatTexts.hp) this.secondaryStatTexts.hp.setText(`HP: ${hp}`);
        if (this.secondaryStatTexts.mp) this.secondaryStatTexts.mp.setText(`MP: ${mp}`);
        if (this.secondaryStatTexts.atk) this.secondaryStatTexts.atk.setText(`ATK: ${this.stats.strength}-${this.stats.strength + GameConfig.SCALING.ATK_RANGE_BONUS}`);
        if (this.secondaryStatTexts.speed) this.secondaryStatTexts.speed.setText(`SPD: ${speed}`);
        if (this.secondaryStatTexts.block) this.secondaryStatTexts.block.setText(`BLK: ${block}%`);
        if (this.secondaryStatTexts.hit) this.secondaryStatTexts.hit.setText(`HIT: ${hitChance}%`);
        if (this.secondaryStatTexts.crit) this.secondaryStatTexts.crit.setText(`CRT: ${crit}%`);
        this.updateButtons();
    }

    private generateVikingName(): string {
        const fn = faker.person.firstName('male'); 
        const title = faker.word.adjective();
        const animal = faker.animal.type();
        return `${fn} the ${title} ${animal}`.replace(/\b\w/g, l => l.toUpperCase());
    }
}