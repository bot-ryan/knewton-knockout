import Phaser from 'phaser';

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

    // UI Refs
    private nameInput?: Phaser.GameObjects.DOMElement;
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

        // --- Layout Constants ---
        const margin = 20;
        const nameH = 80; 
        const leftColW = Math.floor(width * 0.32);
        const colRightX = leftColW + 110; 
        const colRightW = width - colRightX - margin;
        const halfW = colRightW / 2;
        const previewH = height - margin * 2;

        // --- PANELS ---
        const namePanel = this.createPanel(margin, margin, leftColW, nameH, "NAME");
        
        const skillPanelY = nameH + margin * 2;
        const skillPanelH = height - skillPanelY - margin;
        const skillPanel = this.createPanel(margin, skillPanelY, leftColW, skillPanelH, "SKILL ALLOCATION");
        
        this.createPanel(colRightX, margin, halfW - 10, previewH, "PREVIEW");
        const settingsPanel = this.createPanel(colRightX + halfW + 5, margin, halfW - 10, height - margin * 2, "SETTINGS");

        // --- NAME INPUT (Centered in Panel) ---
        const inputW = leftColW - 40;
        const inputH = 30;
        const inputStyle = `width:${inputW}px; height:${inputH}px; background:#0f1422; color:#fff; border:1px solid #22304c; padding:0 8px; font-family:Verdana;`;
        
        // Positioned at relative center: (PanelWidth/2, PanelHeight/2 + offset for title)
        this.nameInput = this.add.dom(leftColW / 2, (nameH / 2) + 8, 'input', inputStyle);

        // Access the underlying HTML element to set the character limit
        const inputElement = this.nameInput.node as HTMLInputElement;
        inputElement.maxLength = 20; // Hard limit at the browser level
        inputElement.placeholder = "Enter name...";

        namePanel.add(this.nameInput);

        this.nameInput.addListener('input').on('input', (e: any) => {
            this.nameValue = (e.target.value || '').trim();
            this.updateButtons();
        });

        // --- POINT BOX (Top Right of Skill Panel) ---
        const pBoxSize = 60;
        const pPanel = this.add.container(leftColW - pBoxSize - 10, 30);
        pPanel.add(this.add.rectangle(0, 0, pBoxSize, pBoxSize, 0x141a2a).setOrigin(0).setStrokeStyle(2, 0x22304c));
        this.pointsText = this.add.text(pBoxSize/2, pBoxSize/2, '9', {fontSize: '32px', color: '#e2c16b', fontFamily:'Georgia'}).setOrigin(0.5);
        pPanel.add(this.pointsText);
        skillPanel.add(pPanel);

        // --- DESCRIPTION BOX (Bottom of Skill Panel) ---
        const descBoxH = 100;
        const descBoxY = skillPanelH - descBoxH - 15;
        skillPanel.add(this.add.rectangle(10, descBoxY, leftColW - 20, descBoxH, 0x0f1422).setOrigin(0).setStrokeStyle(1, 0x22304c));

        this.descText = this.add.text(20, descBoxY + 10, "Hover over a stat to see details.", {
            fontSize: '13px', 
            color: '#9aa4b2', 
            wordWrap: { width: leftColW - 40 },
            lineSpacing: 4
        }).setOrigin(0);
        skillPanel.add(this.descText);

       // --- STATS LIST (Refined Alignment) ---
        const statDescriptions: Record<StatKey, string> = {
            strength: "Increases raw physical damage and carrying capacity.",
            dexterity: "Improves attack speed and movement fluidity.",
            precision: "Higher chance for critical strikes and landing hits.",
            guard: "Reduces damage taken when blocking or parrying.",
            vitality: "Increases total health points and injury resistance.",
            arcane: "Boosts magical effectiveness and mana pool."
        };

        const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
        
        // This is the horizontal center line for your control group (Buttons + Number)
        const controlCenterWorldX = leftColW - 60; 
        const buttonSpacing = 35; // How far the buttons are from the center number

        statKeys.forEach((key, i) => {
            const y = 110 + (i * 45); 
            
            const label = this.add.text(20, y, key.toUpperCase(), { fontSize: '22px', color: '#9aa4b2' })
                .setInteractive({ useHandCursor: true });

            label.on('pointerover', () => {
                label.setColor('#fff');
                if(this.descText) this.descText.setText(statDescriptions[key]);
            });
            label.on('pointerout', () => {
                label.setColor('#9aa4b2');
                if(this.descText) this.descText.setText("Hover over a stat to see details.");
            });

            skillPanel.add(label);
            
            // 1. Central Number (Origin 0.5 makes it perfectly centered on its X)
            const valText = this.add.text(controlCenterWorldX, y + 8, '1', { 
                fontSize: '18px', 
                color: '#fff',
                fontStyle: 'bold' 
            }).setOrigin(0.5);

            // 2. Minus Button (Shifted left of center)
            const minus = makeIconButton(this, controlCenterWorldX - buttonSpacing - 14, y - 4, '–', () => this.decStat(key));
            
            // 3. Plus Button (Shifted right of center)
            const plus = makeIconButton(this, controlCenterWorldX + buttonSpacing - 14, y - 4, '+', () => this.incStat(key));
            
            this.statTexts[key] = valText;
            this.minusButtons[key] = minus; 
            this.plusButtons[key] = plus;
            
            skillPanel.add([minus, valText, plus]);
        });

        // Body Color Palette
        settingsPanel.add(this.add.text(20, 80, 'BODY COLOR PALETTE', {fontSize:'14px', color:'#9aa4b2', fontStyle:'bold'}));
        
        const pickerSize = (halfW - 10) * 0.7;
        new ColorPicker(this, 20, 110, pickerSize, (selectedColor) => {
            this.currentSkinColor = selectedColor;
            this.redrawStickman();
        }, settingsPanel);

        // Action Buttons
        this.confirmBtn = makeRoundButton(this, width - 60, height - 60, 30, 0x12a150, '✓', () => {
            console.log("Saving character:", this.nameValue, this.stats, this.currentSkinColor);
        });
        makeRoundButton(this, width - 130, height - 60, 30, 0xaa3d3d, '✗', () => this.scene.start('MainMenu'));

        // Stickman Preview
        this.stickmanBody = this.add.graphics();
        this.add.container(colRightX + (halfW - 10) / 2, margin + (previewH) / 2, [this.stickmanBody]);

        this.refreshStatsUI();
        this.redrawStickman();
    }

    private redrawStickman() {
        if (!this.stickmanBody) return;
        const g = this.stickmanBody; 
        const s = 1.4; 

        g.clear();
        g.fillStyle(this.currentSkinColor, 1);

        // Head
        g.fillCircle(0, -90 * s, 35 * s); 

        // Torso
        g.beginPath();
        g.moveTo(-15 * s, -60 * s);
        g.lineTo(-25 * s, -10 * s);
        g.lineTo(25 * s, -10 * s);
        g.lineTo(15 * s, -60 * s);
        g.closePath();
        g.fillPath();

        const drawLimb = (dir: number, isArm: boolean) => {
            g.beginPath();
            if(isArm) {
                g.moveTo(dir * 20 * s, -55 * s).lineTo(dir * 45 * s, -30 * s).lineTo(dir * 35 * s, -20 * s).lineTo(dir * 15 * s, -45 * s);
            } else {
                g.moveTo(dir * 5 * s, -10 * s).lineTo(dir * 30 * s, 60 * s).lineTo(dir * 15 * s, 60 * s).lineTo(0 * s, -5 * s);
            }
            g.closePath().fillPath();
        };
        drawLimb(-1, true); drawLimb(1, true); drawLimb(-1, false); drawLimb(1, false);
    }

    private createPanel(x: number, y: number, w: number, h: number, title: string) {
        const container = this.add.container(x, y);
        container.add(this.add.rectangle(0, 0, w, h, 0x141a2a, 0.85).setOrigin(0).setStrokeStyle(2, 0x22304c));
        container.add(this.add.text(15, 10, title, { fontSize: '11px', color: '#5c6a7e', fontStyle: 'bold' }));
        return container;
    }

    private incStat(key: StatKey) { if(this.pointsRemaining > 0) { this.stats[key]++; this.pointsRemaining--; this.refreshStatsUI(); } }
    private decStat(key: StatKey) { if(this.stats[key] > 1) { this.stats[key]--; this.pointsRemaining++; this.refreshStatsUI(); } }
    
    private refreshStatsUI() {
        (Object.keys(this.stats) as StatKey[]).forEach(k => {
            if(this.statTexts[k]) this.statTexts[k]!.setText(String(this.stats[k]));
        });
        if(this.pointsText) this.pointsText.setText(String(this.pointsRemaining));
        this.updateButtons();
    }

    private updateButtons() {
        const canAdd = this.pointsRemaining > 0;
        (Object.keys(this.stats) as StatKey[]).forEach(k => {
            if(this.plusButtons[k]) setButtonEnabled(this.plusButtons[k]!, canAdd);
            if(this.minusButtons[k]) setButtonEnabled(this.minusButtons[k]!, this.stats[k] > 1);
        });
        if(this.confirmBtn) setButtonEnabled(this.confirmBtn, this.pointsRemaining === 0 && this.nameValue.length > 0);
    }
}

// --- COLOR PICKER CLASS ---
class ColorPicker {
    private container: Phaser.GameObjects.Container;
    private wheel: Phaser.GameObjects.Image;
    private selector: Phaser.GameObjects.Arc;

    constructor(scene: Phaser.Scene, x: number, y: number, size: number, onColorSelect: (color: number) => void, parent?: Phaser.GameObjects.Container) {
        this.wheel = scene.add.image(0, 0, 'colorWheel').setDisplaySize(size, size);
        this.selector = scene.add.arc(0, 0, 6, 0, 360, false, 0xffffff, 0).setStrokeStyle(2, 0xffffff);

        this.container = scene.add.container(x + size/2, y + size/2, [this.wheel, this.selector]);
        if (parent) parent.add(this.container);

        this.wheel.setInteractive();

        const handleInput = (pointer: Phaser.Input.Pointer) => {
            const localPoint = this.container.getLocalPoint(pointer.x, pointer.y);
            const source = this.wheel.texture.source[0];
            
            const texX = ((localPoint.x + size/2) / size) * source.width;
            const texY = ((localPoint.y + size/2) / size) * source.height;

            const colorObj = scene.textures.getPixel(texX, texY, 'colorWheel');

            if (colorObj && (colorObj as any).alpha > 0) {
                this.selector.setPosition(localPoint.x, localPoint.y);
                const hex = Phaser.Display.Color.GetColor((colorObj as any).red, (colorObj as any).green, (colorObj as any).blue);
                onColorSelect(hex);
            }
        };

        this.wheel.on('pointerdown', handleInput);
        this.wheel.on('pointermove', (p: Phaser.Input.Pointer) => { if(p.isDown) handleInput(p); });
    }
}

// --- HELPERS (FIXED HIT AREAS) ---
function makeIconButton(scene: Phaser.Scene, x: number, y: number, glyph: string, onClick: () => void) {
    const bg = scene.add.rectangle(0, 0, 28, 28, 0x1c2740)
        .setStrokeStyle(1, 0x2a3a5f)
        .setOrigin(0)
        .setInteractive() 
        .on('pointerdown', onClick);

    const txt = scene.add.text(14, 14, glyph, { fontSize: '16px' }).setOrigin(0.5);
    const container = scene.add.container(x, y, [bg, txt]).setSize(28, 28);
    (container as any).clickTarget = bg;
    return container;
}

function makeRoundButton(scene: Phaser.Scene, x: number, y: number, r: number, color: number, glyph: string, onClick: () => void) {
    const g = scene.add.graphics()
        .fillStyle(color).fillCircle(0,0,r)
        .lineStyle(2,0xffffff,0.3).strokeCircle(0,0,r)
        .setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains)
        .on('pointerdown', onClick);
        
    const t = scene.add.text(0,0,glyph, {fontSize:'24px'}).setOrigin(0.5);
    const container = scene.add.container(x, y, [g, t]).setSize(r*2, r*2);
    (container as any).clickTarget = g;
    return container;
}

function setButtonEnabled(c: Phaser.GameObjects.Container, e: boolean) {
    c.setAlpha(e ? 1 : 0.3); 
    const target = (c as any).clickTarget || c;
    if (target.input) {
        target.input.enabled = e;
    }
}