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
  private skinValue = 128; 

  // UI Refs
  private nameInput?: Phaser.GameObjects.DOMElement;
  private pointsText?: Phaser.GameObjects.Text;
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
    const nameH = 90; 
    const leftColW = Math.floor(width * 0.32);
    const colRightX = leftColW + 110; 
    const colRightW = width - colRightX - margin;
    const halfW = colRightW / 2;
    const previewH = height - margin * 2;

    // --- PANELS ---
    this.createPanel(margin, margin, leftColW, nameH, "NAME");
    this.createPanel(margin, nameH + margin * 2, leftColW, height - nameH - margin * 3, "SKILL ALLOCATION");
    this.createPanel(colRightX, margin, halfW - 10, previewH, "PREVIEW");
    const appPanel = this.createPanel(colRightX + halfW + 5, margin, halfW - 10, height - margin * 2, "SETTINGS");

    // Name Input (DOM)
    const inputStyle = `width:${leftColW - 40}px; height:30px; background:#0f1422; color:#fff; border:1px solid #22304c; padding:0 8px; font-family:Verdana;`;
    this.nameInput = this.add.dom(margin + 20, margin + 45, 'input', inputStyle).setOrigin(0);
    this.nameInput.addListener('input').on('input', (e: any) => {
      this.nameValue = (e.target.value || '').trim();
      this.updateButtons();
    });

    // Point Box
    const pPanel = this.add.container(leftColW + 35, nameH + margin * 2 + 10);
    pPanel.add(this.add.rectangle(0, 0, 80, 80, 0x141a2a).setOrigin(0).setStrokeStyle(2, 0x22304c));
    this.pointsText = this.add.text(40, 40, '9', {fontSize: '42px', color: '#e2c16b', fontFamily:'Georgia'}).setOrigin(0.5);
    pPanel.add(this.pointsText);

    // Stats List
    const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
    statKeys.forEach((key, i) => {
      const y = nameH + 110 + (i * 45); 
      this.add.text(margin + 20, y, key.toUpperCase(), { fontSize: '13px', color: '#9aa4b2' });
      
      const minus = makeIconButton(this, leftColW - 95, y - 4, '–', () => this.decStat(key));
      const valText = this.add.text(leftColW - 60, y - 2, '1', { fontSize: '18px', color: '#fff' }).setOrigin(0.5, 0);
      const plus = makeIconButton(this, leftColW - 45, y - 4, '+', () => this.incStat(key));
      
      this.statTexts[key] = valText;
      this.minusButtons[key] = minus; 
      this.plusButtons[key] = plus;
    });

    // Body Color Settings (Centered a bit more in the panel)
    appPanel.add(this.add.text(20, 100, 'BODY COLOR SPECTRUM', {fontSize:'14px', color:'#9aa4b2', fontStyle:'bold'}));
    new Slider(this, 20, 140, halfW - 60, 0xffffff, this.skinValue, v => { 
        this.skinValue = v; this.redrawStickman(); 
    }, appPanel);

    // Action Buttons
    this.confirmBtn = makeRoundButton(this, width - 60, height - 60, 30, 0x12a150, '✓', () => {
        console.log("Saving character:", this.nameValue, this.stats);
    });
    makeRoundButton(this, width - 130, height - 60, 30, 0xaa3d3d, '✗', () => this.scene.start('MainMenu'));

    // Stickman Preview
    this.stickmanBody = this.add.graphics();
    this.add.container(colRightX + (halfW - 10) / 2, margin + (previewH) / 2, [this.stickmanBody]);

    this.refreshStatsUI();
    this.redrawStickman();
  }

  private getColorFromSpectrum(t: number) {
    const hue = t / 255;
    return Phaser.Display.Color.HSVToRGB(hue, 0.9, 1).color;
  }

  private redrawStickman() {
    if (!this.stickmanBody) return;
    const skin = this.getColorFromSpectrum(this.skinValue);
    const g = this.stickmanBody; 
    const s = 1.4; 

    g.clear();
    g.fillStyle(skin, 1);

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

    // Arms
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

// Helpers
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
  public container: Phaser.GameObjects.Container;
  private thumb: Phaser.GameObjects.Rectangle;
  private width: number;
  private value: number;
  private onChange: (v: number) => void;

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