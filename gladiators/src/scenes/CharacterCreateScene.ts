import Phaser from 'phaser';

type StatKey = 'strength' | 'dexterity' | 'precision' | 'guard' | 'vitality' | 'arcane';

export default class CharacterCreateScene extends Phaser.Scene {
  constructor() { super('CharacterCreate'); }

  // ---------- CONFIG & STATE ----------
  private readonly HAIR_STYLE_NAMES = ['Bald', 'Buzz', 'Spiky', 'Mohawk', 'Side-sweep'];
  
  private pointsRemaining = 9;
  private stats: Record<StatKey, number> = {
    strength: 1, dexterity: 1, precision: 1, guard: 1, vitality: 1, arcane: 1
  };

  private nameValue = '';
  private skinValue = 128; // Start in middle of spectrum
  private hairValue = 30; 
  private hairStyleIndex = 0;

  // UI Refs
  private nameInput?: Phaser.GameObjects.DOMElement;
  private pointsText?: Phaser.GameObjects.Text;
  private statTexts: Partial<Record<StatKey, Phaser.GameObjects.Text>> = {};
  private plusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};
  private minusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};
  private confirmBtn?: Phaser.GameObjects.Container;
  private hairStyleLabel?: Phaser.GameObjects.Text;
  private stickmanBody?: Phaser.GameObjects.Graphics;
  private stickmanHair?: Phaser.GameObjects.Graphics;

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x0b0f1a);

    const margin = 20;
    const leftColW = Math.floor(width * 0.30);
    const rightSideX = leftColW + 130;
    const rightSideW = width - rightSideX - margin;
    const halfW = rightSideW / 2;

    // --- 1. LEFT COLUMN (NAME & STATS) ---
    this.createPanel(margin, margin, leftColW, 90, "NAME");
    const inputStyle = `width:${leftColW - 40}px; height:30px; background:#0f1422; border:1px solid #22304c; color:#fff; padding:0 8px; font-family:Verdana;`;
    this.nameInput = this.add.dom(margin + 20, margin + 45, 'input', inputStyle).setOrigin(0);
    this.nameInput.addListener('input').on('input', (e: any) => {
      this.nameValue = (e.target.value || '').trim();
      this.updateButtons();
    });

    const statsPanel = this.createPanel(margin, 130, leftColW, height - 130 - margin, "SKILL ALLOCATION");
    const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
    statKeys.forEach((key, i) => {
      const y = 60 + (i * 45);
      statsPanel.add(this.add.text(20, y, key.toUpperCase(), { fontSize: '13px', color: '#9aa4b2' }));
      const minus = makeIconButton(this, leftColW - 95, y - 4, '–', () => this.decStat(key));
      const valText = this.add.text(leftColW - 60, y - 2, '1', { fontSize: '18px', color: '#fff' }).setOrigin(0.5, 0);
      const plus = makeIconButton(this, leftColW - 45, y - 4, '+', () => this.incStat(key));
      this.statTexts[key] = valText;
      this.minusButtons[key] = minus; this.plusButtons[key] = plus;
      statsPanel.add([minus, valText, plus]);
    });

    // --- 2. CENTER POINT BOX ---
    const pPanel = this.add.container(leftColW + 35, 140);
    pPanel.add(this.add.rectangle(0, 0, 80, 80, 0x141a2a).setOrigin(0).setStrokeStyle(2, 0x22304c));
    this.pointsText = this.add.text(40, 40, '9', {fontSize: '42px', color: '#e2c16b', fontFamily:'Georgia'}).setOrigin(0.5);
    pPanel.add(this.pointsText);

    // --- 3. RIGHT COLUMNS (PREVIEW & SETTINGS) ---
    const previewPanel = this.createPanel(rightSideX, margin, halfW - 10, height - margin * 2, "PREVIEW");
    this.stickmanBody = this.add.graphics();
    this.stickmanHair = this.add.graphics();
    const stickContainer = this.add.container((halfW - 10) / 2, (height - margin * 2) / 2 + 50, [this.stickmanBody, this.stickmanHair]);
    previewPanel.add(stickContainer);

    const appPanel = this.createPanel(rightSideX + halfW + 5, margin, halfW - 10, height - margin * 2, "SETTINGS");
    
    appPanel.add(this.add.text(20, 60, 'Body Color Spectrum', {fontSize:'14px', color:'#9aa4b2'}));
    new Slider(this, 20, 95, halfW - 60, 0xffffff, this.skinValue, v => { 
        this.skinValue = v; this.redrawStickman(); 
    }, appPanel);
    
    appPanel.add(this.add.text(20, 160, 'Hairstyle', {fontSize:'14px', color:'#9aa4b2'}));
    const hL = makeIconButton(this, 20, 190, '◀', () => this.changeHair(-1));
    this.hairStyleLabel = this.add.text(halfW / 2, 195, 'Bald', {fontSize:'16px'}).setOrigin(0.5, 0);
    const hR = makeIconButton(this, halfW - 55, 190, '▶', () => this.changeHair(1));

    appPanel.add(this.add.text(20, 260, 'Hair Color Spectrum', {fontSize:'14px', color:'#9aa4b2'}));
    new Slider(this, 20, 295, halfW - 60, 0xffffff, this.hairValue, v => { 
        this.hairValue = v; this.redrawStickman(); 
    }, appPanel);

    appPanel.add([hL, hR, this.hairStyleLabel]);

    // Randomize Button
    const randBtn = makeRoundButton(this, rightSideX + halfW + 50, height - 60, 20, 0x4a5568, '?', () => {
        this.skinValue = Phaser.Math.Between(0, 255);
        this.hairValue = Phaser.Math.Between(0, 255);
        this.hairStyleIndex = Phaser.Math.Between(0, this.HAIR_STYLE_NAMES.length - 1);
        this.hairStyleLabel?.setText(this.HAIR_STYLE_NAMES[this.hairStyleIndex]);
        this.redrawStickman();
        // Note: Manual slider thumb update would go here if slider instances were stored
    });

    // --- 4. ACTION BUTTONS ---
    this.confirmBtn = makeRoundButton(this, width - 60, height - 60, 30, 0x12a150, '✓', () => console.log("Character Confirmed!"));
    makeRoundButton(this, width - 130, height - 60, 30, 0xaa3d3d, '✗', () => this.scene.start('MainMenu'));

    this.refreshStatsUI();
    this.redrawStickman();
  }

  // ---------- COLOR LOGIC ----------
  private getColorFromSpectrum(t: number) {
    const hue = t / 255;
    let s = 0.8;
    let v = 1;
    if (hue > 0.95) v = Phaser.Math.Linear(1, 0, (hue - 0.95) * 20); // Fade to black at very end
    return Phaser.Display.Color.HSVToRGB(hue, s, v).color;
  }

  // ---------- RENDER LOGIC ----------
  private redrawStickman() {
    if (!this.stickmanBody || !this.stickmanHair) return;
    const skin = this.getColorFromSpectrum(this.skinValue);
    const hair = this.getColorFromSpectrum(this.hairValue);
    const g = this.stickmanBody; 
    const h = this.stickmanHair;
    const s = 1.6;

    g.clear(); h.clear();
    
    // Shadow
    g.fillStyle(0x000000, 0.2).fillEllipse(0, 65 * s, 45 * s, 10 * s); 

    // ALL body parts now use 'skin' fill and solid shapes
    g.fillStyle(skin).lineStyle(4, 0x111111);

    // Head
    g.fillCircle(0, -120 * s, 26 * s).strokeCircle(0, -120 * s, 26 * s); 

    // Torso (Solid Fill)
    g.fillRoundedRect(-30 * s, -110 * s, 60 * s, 75 * s, 12 * s).strokeRoundedRect(-30 * s, -110 * s, 60 * s, 75 * s, 12 * s); 
    g.fillRoundedRect(-22 * s, -40 * s, 44 * s, 35 * s, 8 * s).strokeRoundedRect(-22 * s, -40 * s, 44 * s, 35 * s, 8 * s);

    // Arms (Solid Paths)
    const drawLimb = (pts: number[]) => {
        g.beginPath();
        g.moveTo(pts[0], pts[1]);
        for(let i=2; i<pts.length; i+=2) g.lineTo(pts[i], pts[i+1]);
        g.closePath(); g.fillPath(); g.strokePath();
    };

    // Left Arm
    drawLimb([-30*s, -100*s, -55*s, -60*s, -45*s, -55*s, -25*s, -90*s]);
    // Right Arm
    drawLimb([30*s, -100*s, 55*s, -60*s, 45*s, -55*s, 25*s, -90*s]);
    // Left Leg
    drawLimb([-18*s, -10*s, -28*s, 60*s, -12*s, 60*s, -5*s, -10*s]);
    // Right Leg
    drawLimb([18*s, -10*s, 28*s, 60*s, 12*s, 60*s, 5*s, -10*s]);

    // Hair Style
    h.fillStyle(hair);
    if (this.hairStyleIndex === 1) { // Buzz
        h.fillEllipse(0, -130*s, 27*s, 15*s);
    } else if (this.hairStyleIndex === 2) { // Spiky
        for(let i=0; i<6; i++) {
            const px = -25*s + (i*10*s);
            h.beginPath().moveTo(px, -145*s).lineTo(px+5*s, -165*s).lineTo(px+10*s, -145*s).fillPath();
        }
    } else if (this.hairStyleIndex === 3) { // Mohawk
        h.fillRoundedRect(-5 * s, -175 * s, 10 * s, 40 * s, 4 * s);
    } else if (this.hairStyleIndex === 4) { // Side-sweep
        h.beginPath().moveTo(-25*s, -140*s).lineTo(25*s, -140*s).lineTo(35*s, -115*s).lineTo(-10*s, -125*s).fillPath();
    }
  }

  // ---------- UI HELPERS ----------
  private createPanel(x: number, y: number, w: number, h: number, title: string) {
    const container = this.add.container(x, y);
    container.add(this.add.rectangle(0, 0, w, h, 0x141a2a, 0.85).setOrigin(0).setStrokeStyle(2, 0x22304c));
    container.add(this.add.text(15, 10, title, { fontSize: '11px', color: '#5c6a7e', fontStyle: 'bold' }));
    return container;
  }

  private incStat(key: StatKey) { if(this.pointsRemaining > 0) { this.stats[key]++; this.pointsRemaining--; this.refreshStatsUI(); } }
  private decStat(key: StatKey) { if(this.stats[key] > 1) { this.stats[key]--; this.pointsRemaining++; this.refreshStatsUI(); } }
  
  private changeHair(dir: number) { 
    this.hairStyleIndex = Phaser.Math.Wrap(this.hairStyleIndex + dir, 0, this.HAIR_STYLE_NAMES.length);
    this.hairStyleLabel?.setText(this.HAIR_STYLE_NAMES[this.hairStyleIndex]);
    this.redrawStickman();
  }

  private refreshStatsUI() {
    (Object.keys(this.stats) as StatKey[]).forEach(k => this.statTexts[k]?.setText(String(this.stats[k])));
    this.pointsText?.setText(String(this.pointsRemaining));
    this.updateButtons();
  }

  private updateButtons() {
    const canAdd = this.pointsRemaining > 0;
    (Object.keys(this.stats) as StatKey[]).forEach(k => {
      setButtonEnabled(this.plusButtons[k]!, canAdd);
      setButtonEnabled(this.minusButtons[k]!, this.stats[k] > 1);
    });
    setButtonEnabled(this.confirmBtn!, this.pointsRemaining === 0 && this.nameValue.length > 0);
  }
}

// ---------- GLOBAL HELPERS ----------
function makeIconButton(scene: Phaser.Scene, x: number, y: number, glyph: string, onClick: () => void) {
  const bg = scene.add.rectangle(0, 0, 28, 28, 0x1c2740).setStrokeStyle(1, 0x2a3a5f).setOrigin(0);
  const txt = scene.add.text(14, 14, glyph, { fontSize: '16px' }).setOrigin(0.5);
  return scene.add.container(x, y, [bg, txt]).setSize(28, 28).setInteractive().on('pointerdown', onClick);
}

function makeRoundButton(scene: Phaser.Scene, x: number, y: number, r: number, color: number, glyph: string, onClick: () => void) {
  const g = scene.add.graphics().fillStyle(color).fillCircle(0,0,r).lineStyle(2,0xffffff,0.3).strokeCircle(0,0,r);
  const t = scene.add.text(0,0,glyph, {fontSize:'24px'}).setOrigin(0.5);
  return scene.add.container(x, y, [g, t]).setSize(r*2, r*2).setInteractive(new Phaser.Geom.Circle(0,0,r), Phaser.Geom.Circle.Contains).on('pointerdown', onClick);
}

function setButtonEnabled(c: Phaser.GameObjects.Container, e: boolean) {
  c.setAlpha(e ? 1 : 0.3); e ? c.setInteractive() : c.disableInteractive();
}

class Slider {
  private thumb: Phaser.GameObjects.Rectangle;
  private width: number;
  private value: number;
  private onChange: (v: number) => void;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, thumbColor: number, initial: number, onChange: (v: number) => void, parent?: Phaser.GameObjects.Container) {
    this.width = width; this.onChange = onChange; this.value = initial;
    const track = scene.add.rectangle(0, 0, width, 6, 0x233255).setOrigin(0, 0.5);
    this.thumb = scene.add.rectangle(0, 0, 12, 24, thumbColor).setStrokeStyle(2, 0xffffff);
    this.container = scene.add.container(x, y, [track, this.thumb]);
    if (parent) parent.add(this.container);

    this.container.setInteractive(new Phaser.Geom.Rectangle(0, -20, width, 40), Phaser.Geom.Rectangle.Contains);
    
    const handleInput = (p: Phaser.Input.Pointer) => {
      const localPoint = this.container.getLocalPoint(p.x, p.y);
      this.value = Phaser.Math.Clamp((localPoint.x / this.width) * 255, 0, 255);
      this.updateThumb();
      this.onChange(this.value);
    };

    this.container.on('pointerdown', handleInput);
    this.container.on('pointermove', (p: Phaser.Input.Pointer) => { if(p.isDown) handleInput(p); });
    this.updateThumb();
  }
  private updateThumb() { this.thumb.x = (this.value / 255) * this.width; }
}