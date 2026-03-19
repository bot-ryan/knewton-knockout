import Phaser from 'phaser';
import { faker } from '@faker-js/faker';

type StatKey = 'strength' | 'dexterity' | 'precision' | 'guard' | 'vitality' | 'arcane';

export default class CharacterCreateScene extends Phaser.Scene {
    constructor() { super('CharacterCreate'); }

    // ---------- STATE ----------
    private readonly FREE_POINTS = 9;
    private pointsRemaining = this.FREE_POINTS;
    private stats: Record<StatKey, number> = {
        strength: 1, dexterity: 1, precision: 1, guard: 1, vitality: 1, arcane: 1
    };

    private nameValue = '';
    private currentSkinColor = 0x3498db; 

    private BANNED_WORDS: string[] = [];
    private readonly DUMMY_NAMES = ["The Bad Mouth", "Silly Goose", "Keyboard Masher", "Default Dave", "Mr. No-Name", "Lord Fluffbottom"];

    // UI Refs
    private nameInput?: Phaser.GameObjects.DOMElement;
    private nameErrorText?: Phaser.GameObjects.Text;
    private pointsText?: Phaser.GameObjects.Text;
    private descText?: Phaser.GameObjects.Text;
    private statTexts: Partial<Record<StatKey, Phaser.GameObjects.Text>> = {};
    private plusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};
    private minusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};
    private confirmBtn?: Phaser.GameObjects.Container;
    private stickmanBody?: Phaser.GameObjects.Graphics;

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x0b0f1a);

        // Load banned words
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

        // Tooltip for Dice
        const cursorTooltip = this.add.text(0, 0, "Randomize\nCharacter", {
            fontSize: '12px', backgroundColor: '#000000', color: '#ffffff', padding: { x: 8, y: 4 }, fontFamily: 'Verdana'
        }).setOrigin(0).setDepth(100).setAlpha(0);

        const randomizeBtn = makeTransparentIconButton(this, settingsPanelW - 55, 45, '🎲', '40px', cursorTooltip, () => { this.randomizeAll(); });
        settingsPanel.add(randomizeBtn);

        // Name Input + Validation
        const inputW = leftColW - 40;
        const inputH = 30;
        const inputStyle = `width:${inputW}px; height:${inputH}px; background:#0f1422; color:#fff; border:1px solid #22304c; padding:0 8px; font-family:Verdana; outline:none;`;
        this.nameInput = this.add.dom(leftColW / 2, (nameH / 2), 'input', inputStyle);
        const el = this.nameInput.node as HTMLInputElement;
        el.maxLength = 40; 
        el.placeholder = "Enter Name...";

        this.nameErrorText = this.add.text(leftColW / 2, nameH - 12, '', { fontSize: '10px', color: '#ff4d4d', fontStyle: 'bold' }).setOrigin(0.5);
        namePanel.add([this.nameInput, this.nameErrorText]);

        this.nameInput.addListener('input').on('input', (e: any) => {
            // Only allow letters (a-z, A-Z) and spaces
            const filtered = e.target.value.replace(/[^a-zA-Z ]/g, '');
            e.target.value = filtered;
            this.nameValue = filtered;
            this.updateButtons();
        });

        // Skill Allocation UI
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
            strength: "Increases raw physical damage and carrying capacity.",
            dexterity: "Improves attack speed and movement fluidity.",
            precision: "Higher chance for critical strikes and landing hits.",
            guard: "Reduces damage taken when blocking or parrying.",
            vitality: "Increases total health points and injury resistance.",
            arcane: "Boosts magical effectiveness and mana pool."
        };

        const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
        const controlX = leftColW - 60; 
        statKeys.forEach((key, i) => {
            const y = 110 + (i * 45); 
            const label = this.add.text(20, y, key.toUpperCase(), { fontSize: '13px', color: '#9aa4b2' }).setInteractive({ useHandCursor: true });
            
            label.on('pointerover', () => { 
                label.setColor('#fff'); 
                if(this.descText) this.descText.setText(statDescriptions[key]);
            });
            label.on('pointerout', () => { 
                label.setColor('#9aa4b2'); 
                if(this.descText) this.descText.setText("Hover over a stat to see details.");
            });

            skillPanel.add(label);
            const valText = this.add.text(controlX, y + 8, '1', { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            const minus = makeIconButton(this, controlX - 49, y - 4, '–', () => this.decStat(key));
            const plus = makeIconButton(this, controlX + 21, y - 4, '+', () => this.incStat(key));
            this.statTexts[key] = valText;
            this.minusButtons[key] = minus; 
            this.plusButtons[key] = plus;
            skillPanel.add([minus, valText, plus]);
        });

        settingsPanel.add(this.add.text(20, 80, 'BODY COLOR PALETTE', {fontSize:'14px', color:'#9aa4b2', fontStyle:'bold'}));
        new ColorPicker(this, 20, 110, settingsPanelW * 0.7, (c) => { this.currentSkinColor = c; this.redrawStickman(); }, settingsPanel);

       // --- UPDATED CONFIRM LOGIC ---
this.confirmBtn = makeRoundButton(this, width - 60, height - 60, 30, 0x12a150, '✓', () => {
    const trimmedName = this.nameValue.trim();
    
    // 1. Check for Empty String first
    if (trimmedName === "") {
        this.nameValue = "Nameless";
        if (this.nameInput) (this.nameInput.node as HTMLInputElement).value = "Nameless";
        if (this.nameErrorText) {
            this.nameErrorText.setText("No name? You are now 'Nameless'");
            this.time.delayedCall(3000, () => { if(this.nameErrorText) this.nameErrorText.setText(''); });
        }
    } 
    // 2. Check for Banned Words
    else {
        const nameStatus = this.validateName(this.nameValue);
        if (!nameStatus.valid) {
            // Swap to a random dummy name
            const dummyName = Phaser.Utils.Array.GetRandom(this.DUMMY_NAMES);
            this.nameValue = dummyName;
            if (this.nameInput) (this.nameInput.node as HTMLInputElement).value = dummyName;
            
            if (this.nameErrorText) {
                this.nameErrorText.setText("I WARNED YOU!!");
                this.time.delayedCall(3000, () => { if(this.nameErrorText) this.nameErrorText.setText(''); });
            }
        }
    }

    console.log("Character Saved!", this.nameValue, this.stats);
    // Proceed to GameScene
});

        makeRoundButton(this, width - 130, height - 60, 30, 0xaa3d3d, '✗', () => this.scene.start('MainMenu'));

        this.stickmanBody = this.add.graphics();
        this.add.container(colRightX + (halfW - 10) / 2, margin + (previewH) / 2, [this.stickmanBody]);
        this.refreshStatsUI();
        this.redrawStickman();
    }

    private randomizeAll() {
        const randomName = this.generateVikingName();
        this.nameValue = randomName;
        if (this.nameInput) (this.nameInput.node as HTMLInputElement).value = randomName;
        this.currentSkinColor = Math.floor(Math.random() * 0xffffff);
        this.redrawStickman();
        const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
        statKeys.forEach(k => this.stats[k] = 1);
        this.pointsRemaining = this.FREE_POINTS;
        while (this.pointsRemaining > 0) {
            this.stats[Phaser.Utils.Array.GetRandom(statKeys)]++;
            this.pointsRemaining--;
        }
        this.refreshStatsUI();
    }

    private validateName(name: string): { valid: boolean; error: string } {
        //const trimmed = name.trim(); 
        //if (trimmed.length === 0) return { valid: false, error: "NAME REQUIRED" };
        //if (trimmed.length < 3) return { valid: false, error: "NAME TOO SHORT" };
        if (this.BANNED_WORDS.some(w => name.toLowerCase().includes(w))) return { valid: false, error: "BANNED WORD" };
        return { valid: true, error: "" };
    }

    private updateButtons() {
        const nameStatus = this.validateName(this.nameValue);
        if (this.nameErrorText) {
            this.nameErrorText.setText(nameStatus.error);
        }

        const canAdd = this.pointsRemaining > 0;
        (Object.keys(this.stats) as StatKey[]).forEach(k => {
            if(this.plusButtons[k]) setButtonEnabled(this.plusButtons[k]!, canAdd);
            if(this.minusButtons[k]) setButtonEnabled(this.minusButtons[k]!, this.stats[k] > 1);
        });

        // Banned names no longer disable the button, only point count does
        if(this.confirmBtn) setButtonEnabled(this.confirmBtn, this.pointsRemaining === 0);
    }

    private redrawStickman() {
        if (!this.stickmanBody) return;
        const g = this.stickmanBody, s = 1.4; 
        g.clear().fillStyle(this.currentSkinColor, 1);
        g.fillCircle(0, -90 * s, 35 * s); 
        g.beginPath().moveTo(-15*s,-60*s).lineTo(-25*s,-10*s).lineTo(25*s,-10*s).lineTo(15*s,-60*s).closePath().fillPath();
        const drawLimb = (dir: number, isArm: boolean) => {
            g.beginPath();
            if(isArm) g.moveTo(dir*20*s,-55*s).lineTo(dir*45*s,-30*s).lineTo(dir*35*s,-20*s).lineTo(dir*15*s,-45*s);
            else g.moveTo(dir*5*s,-10*s).lineTo(dir*30*s,60*s).lineTo(dir*15*s,60*s).lineTo(0,-5*s);
            g.closePath().fillPath();
        };
        drawLimb(-1, true); drawLimb(1, true); drawLimb(-1, false); drawLimb(1, false);
    }

    private createPanel(x: number, y: number, w: number, h: number, title: string) {
        const c = this.add.container(x, y);
        c.add(this.add.rectangle(0, 0, w, h, 0x141a2a, 0.85).setOrigin(0).setStrokeStyle(2, 0x22304c));
        c.add(this.add.text(15, 10, title, { fontSize: '11px', color: '#5c6a7e', fontStyle: 'bold' }));
        return c;
    }

    private incStat(key: StatKey) { if(this.pointsRemaining > 0) { this.stats[key]++; this.pointsRemaining--; this.refreshStatsUI(); } }
    private decStat(key: StatKey) { if(this.stats[key] > 1) { this.stats[key]--; this.pointsRemaining++; this.refreshStatsUI(); } }
    private refreshStatsUI() {
        (Object.keys(this.stats) as StatKey[]).forEach(k => { if(this.statTexts[k]) this.statTexts[k]!.setText(String(this.stats[k])); });
        if(this.pointsText) this.pointsText.setText(String(this.pointsRemaining));
        this.updateButtons();
    }

    private generateVikingName(): string {
        const fn = faker.person.firstName('male'); 
        const title = faker.word.adjective();
        const animal = faker.animal.type();
        return `${fn} the ${title} ${animal}`.replace(/\b\w/g, l => l.toUpperCase());
    }
}

// --- HELPERS ---

function makeTransparentIconButton(scene: Phaser.Scene, x: number, y: number, glyph: string, fontSize: string, tooltip: Phaser.GameObjects.Text, onClick: () => void) {
    const txt = scene.add.text(0, 0, glyph, { fontSize, padding: { top: 10, bottom: 10, left: 5, right: 5 } }).setOrigin(0.5);
    const hitArea = scene.add.zone(0, 0, 50, 50).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', onClick);

    hitArea.on('pointerover', () => {
        scene.tweens.add({ targets: tooltip, alpha: 1, duration: 150 });
        scene.tweens.add({ targets: txt, scale: 1.2, duration: 100 });
    });

    hitArea.on('pointerout', () => {
        scene.tweens.add({ targets: tooltip, alpha: 0, duration: 150 });
        scene.tweens.add({ targets: txt, scale: 1, duration: 100 });
    });

    hitArea.on('pointermove', (p: Phaser.Input.Pointer) => {
        tooltip.setPosition(p.x + 15, p.y + 15);
    });

    const c = scene.add.container(x, y, [hitArea, txt]).setSize(50, 50);
    (c as any).clickTarget = hitArea;
    return c;
}

function makeIconButton(scene: Phaser.Scene, x: number, y: number, glyph: string, onClick: () => void) {
    const bg = scene.add.rectangle(0, 0, 28, 28, 0x1c2740).setStrokeStyle(1, 0x2a3a5f).setOrigin(0).setInteractive().on('pointerdown', onClick);
    const txt = scene.add.text(14, 14, glyph, { fontSize: '16px' }).setOrigin(0.5);
    const c = scene.add.container(x, y, [bg, txt]).setSize(28, 28);
    (c as any).clickTarget = bg;
    return c;
}

function makeRoundButton(scene: Phaser.Scene, x: number, y: number, r: number, color: number, glyph: string, onClick: () => void) {
    const g = scene.add.graphics().fillStyle(color).fillCircle(0,0,r).lineStyle(2,0xffffff,0.3).strokeCircle(0,0,r)
        .setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains).on('pointerdown', onClick);
    const t = scene.add.text(0,0,glyph, {fontSize:'24px'}).setOrigin(0.5);
    const c = scene.add.container(x, y, [g, t]).setSize(r*2, r*2);
    (c as any).clickTarget = g;
    return c;
}

function setButtonEnabled(c: Phaser.GameObjects.Container, e: boolean) {
    c.setAlpha(e ? 1 : 0.3); 
    const target = (c as any).clickTarget || c;
    if (target.input) target.input.enabled = e;
}

class ColorPicker {
    private container: Phaser.GameObjects.Container;
    constructor(scene: Phaser.Scene, x: number, y: number, size: number, onColorSelect: (c: number) => void, parent?: Phaser.GameObjects.Container) {
        const wheel = scene.add.image(0, 0, 'colorWheel').setDisplaySize(size, size).setInteractive();
        const selector = scene.add.arc(0, 0, 6, 0, 360, false, 0xffffff, 0).setStrokeStyle(2, 0xffffff);
        this.container = scene.add.container(x + size/2, y + size/2, [wheel, selector]);
        if (parent) parent.add(this.container);
        const handleInput = (p: Phaser.Input.Pointer) => {
            const lp = this.container.getLocalPoint(p.x, p.y);
            const src = wheel.texture.source[0];
            const tx = ((lp.x + size/2) / size) * src.width;
            const ty = ((lp.y + size/2) / size) * src.height;
            const col = scene.textures.getPixel(tx, ty, 'colorWheel');
            if (col && (col as any).alpha > 0) {
                selector.setPosition(lp.x, lp.y);
                onColorSelect(Phaser.Display.Color.GetColor((col as any).red, (col as any).green, (col as any).blue));
            }
        };
        wheel.on('pointerdown', handleInput);
        wheel.on('pointermove', (p: any) => { if(p.isDown) handleInput(p); });
    }
}