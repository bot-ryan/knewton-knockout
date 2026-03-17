// src/scenes/CharacterCreateScene.ts
import Phaser from 'phaser';

type StatKey = 'strength' | 'dexterity' | 'precision' | 'guard' | 'vitality' | 'arcane';

interface CharacterAppearance {
  skinColor: number;   // 0xRRGGBB
  hairColor: number;   // 0xRRGGBB
  hairStyle: number;   // index into HAIR_STYLES
}

interface CharacterStats {
  strength: number;
  dexterity: number;
  precision: number;
  guard: number;
  vitality: number;
  arcane: number;
}

interface CharacterData {
  id: string;                // could be uuid; for now simple timestamp string
  name: string;
  appearance: CharacterAppearance;
  stats: CharacterStats;
  meta: {
    createdAt: string;
    version: number;
  };
}

export default class CharacterCreateScene extends Phaser.Scene {
  constructor() {
    super('CharacterCreate');
  }

  // ---------- CONSTANTS ----------
  private readonly BASE = 1;
  private readonly FREE_POINTS = 9;

  private readonly HAIR_STYLE_NAMES = ['Bald', 'Buzz', 'Spiky', 'Mohawk', 'Side-sweep'];

  // ---------- STATE ----------
  private pointsRemaining = this.FREE_POINTS;
  private stats: Record<StatKey, number> = {
    strength: this.BASE,
    dexterity: this.BASE,
    precision: this.BASE,
    guard: this.BASE,
    vitality: this.BASE,
    arcane: this.BASE
  };

  private nameValue = '';
  private skinRGB = { r: 230, g: 190, b: 160 };
  private hairRGB = { r: 30, g: 20, b: 10 };
  private hairStyleIndex = 0;

  // ---------- UI ELEMENT REFS ----------
  private nameInput?: Phaser.GameObjects.DOMElement;
  private pointsText?: Phaser.GameObjects.Text;
  private statTexts: Partial<Record<StatKey, Phaser.GameObjects.Text>> = {};
  private plusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};
  private minusButtons: Partial<Record<StatKey, Phaser.GameObjects.Container>> = {};

  private confirmBtn?: Phaser.GameObjects.Container;
  private cancelBtn?: Phaser.GameObjects.Container;
  private randomizeBtn?: Phaser.GameObjects.Container;

  private hairLeftBtn?: Phaser.GameObjects.Container;
  private hairRightBtn?: Phaser.GameObjects.Container;
  private hairStyleLabel?: Phaser.GameObjects.Text;

  private skinSliderR?: Slider;
  private skinSliderG?: Slider;
  private skinSliderB?: Slider;
  private hairSliderR?: Slider;
  private hairSliderG?: Slider;
  private hairSliderB?: Slider;

  // Stickman layers
  private stickmanContainer?: Phaser.GameObjects.Container;
  private stickmanBody?: Phaser.GameObjects.Graphics;
  private stickmanHair?: Phaser.GameObjects.Graphics;

  // Panels for layout
  private leftPanel?: Phaser.GameObjects.Container;
  private statsPanel?: Phaser.GameObjects.Container;
  private pointsPanel?: Phaser.GameObjects.Container;
  private rightPanel?: Phaser.GameObjects.Container;

  // ---------- LIFECYCLE ----------
  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x0b0f1a);

    // Main layout containers
    this.leftPanel = this.add.container(0, 0);
    this.statsPanel = this.add.container(0, 0);
    this.pointsPanel = this.add.container(0, 0);
    this.rightPanel = this.add.container(0, 0);

    // Title
    this.add.text(width * 0.05, height * 0.04, 'Character Creation', {
      fontFamily: 'Verdana, Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff'
    });

    // Panels (visual frames)
    const leftPanelBG = this.add.rectangle(0, 0, width * 0.42, height * 0.82, 0x141a2a, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x22304c);
    const statsPanelBG = this.add.rectangle(0, 0, width * 0.28, height * 0.42, 0x141a2a, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x22304c);
    const pointsPanelBG = this.add.rectangle(0, 0, width * 0.12, height * 0.18, 0x141a2a, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x22304c);
    const rightPanelBG = this.add.rectangle(0, 0, width * 0.38, height * 0.82, 0x141a2a, 0.6)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x22304c);

    this.leftPanel.add(leftPanelBG);
    this.statsPanel.add(statsPanelBG);
    this.pointsPanel.add(pointsPanelBG);
    this.rightPanel.add(rightPanelBG);

    // Position panels
    this.leftPanel.setPosition(width * 0.05, height * 0.10);
    this.statsPanel.setPosition(width * 0.05, height * 0.60);
    this.pointsPanel.setPosition(width * 0.35, height * 0.60);
    this.rightPanel.setPosition(width * 0.58, height * 0.10);

    // --- Name input (DOM) ---
    // IMPORTANT: Enable DOM plugin in game config: dom: { createContainer: true }
    const inputStyle = `
      width:${Math.floor(width * 0.37)}px;
      height:32px;
      font-size:18px;
      font-family:Verdana, sans-serif;
      color:#e0e6f0;
      background:#0f1422;
      border:1px solid #22304c;
      padding:6px 8px;
      outline:none;
      border-radius:6px;
    `;
    this.nameInput = this.add.dom(width * 0.26, height * 0.16, 'input', inputStyle)
      .setOrigin(0.5, 0.5)
      .addListener('input')
      .on('input', (e: any) => {
        this.nameValue = (e.target?.value ?? '').trim();
        this.updateConfirmEnabled();
      }) as Phaser.GameObjects.DOMElement;

    this.add.text(width * 0.06, height * 0.13, 'Enter name:', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '16px',
      color: '#9aa4b2'
    });

    // --- Skin colour sliders ---
    this.add.text(width * 0.06, height * 0.20, 'Skin colour', textSmallStyle());

    const sliderX = width * 0.06;
    const skinY = height * 0.24;
    const sliderW = Math.max(180, width * 0.33);

    this.skinSliderR = new Slider(this, sliderX, skinY, sliderW, 0xff0000, this.skinRGB.r, v => {
      this.skinRGB.r = v; this.redrawStickman();
    });
    this.skinSliderG = new Slider(this, sliderX, skinY + 26, sliderW, 0x00ff00, this.skinRGB.g, v => {
      this.skinRGB.g = v; this.redrawStickman();
    });
    this.skinSliderB = new Slider(this, sliderX, skinY + 52, sliderW, 0x0088ff, this.skinRGB.b, v => {
      this.skinRGB.b = v; this.redrawStickman();
    });

    // --- Hairstyle selector ---
    const hairLabelY = skinY + 88;
    this.add.text(width * 0.06, hairLabelY, 'Hairstyle', textSmallStyle());
    const arrowsY = hairLabelY + 30;

    this.hairLeftBtn = makeIconButton(this, width * 0.06, arrowsY, '◀', () => {
      this.hairStyleIndex = (this.hairStyleIndex - 1 + this.HAIR_STYLE_NAMES.length) % this.HAIR_STYLE_NAMES.length;
      this.updateHairStyleLabel(); this.redrawStickman();
    });
    this.hairStyleLabel = this.add.text(width * 0.11, arrowsY - 12, this.HAIR_STYLE_NAMES[this.hairStyleIndex], {
      fontFamily: 'Verdana, sans-serif', fontSize: '18px', color: '#e0e6f0'
    });
    this.hairRightBtn = makeIconButton(this, width * 0.40, arrowsY, '▶', () => {
      this.hairStyleIndex = (this.hairStyleIndex + 1) % this.HAIR_STYLE_NAMES.length;
      this.updateHairStyleLabel(); this.redrawStickman();
    });

    // --- Hair colour sliders ---
    const hairColorLabelY = arrowsY + 40;
    this.add.text(width * 0.06, hairColorLabelY, 'Hair colour', textSmallStyle());
    const hairY = hairColorLabelY + 28;

    this.hairSliderR = new Slider(this, sliderX, hairY, sliderW, 0xff0000, this.hairRGB.r, v => {
      this.hairRGB.r = v; this.redrawStickman();
    });
    this.hairSliderG = new Slider(this, sliderX, hairY + 26, sliderW, 0x00ff00, this.hairRGB.g, v => {
      this.hairRGB.g = v; this.redrawStickman();
    });
    this.hairSliderB = new Slider(this, sliderX, hairY + 52, sliderW, 0x0088ff, this.hairRGB.b, v => {
      this.hairRGB.b = v; this.redrawStickman();
    });

    // --- Randomize button ---
    this.randomizeBtn = makeButton(this, width * 0.06, hairY + 90, 140, 34, 'Randomize', () => {
      this.randomizeAll();
    });
    this.leftPanel.add([
      this.skinSliderR.container, this.skinSliderG.container, this.skinSliderB.container,
      this.hairSliderR.container, this.hairSliderG.container, this.hairSliderB.container,
      this.hairLeftBtn!, this.hairRightBtn!, this.hairStyleLabel!, this.randomizeBtn!
    ]);

    // --- Stats grid (6 rows, 12 buttons) ---
    const statKeys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
    const statNames = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
    const startX = width * 0.06;
    const startY = height * 0.62;
    const rowH = 36;

    for (let i = 0; i < statKeys.length; i++) {
      const key = statKeys[i];
      const y = startY + i * rowH;

      this.add.text(startX, y, statNames[i], {
        fontFamily: 'Verdana, sans-serif', fontSize: '18px', color: '#e0e6f0'
      });

      const minus = makeIconButton(this, startX + 150, y + 12, '–', () => this.decStat(key));
      const valText = this.add.text(startX + 190, y, String(this.stats[key]), {
        fontFamily: 'Verdana, sans-serif', fontSize: '18px', color: '#ffffff'
      });
      const plus = makeIconButton(this, startX + 230, y + 12, '+', () => this.incStat(key));

      this.minusButtons[key] = minus;
      this.statTexts[key] = valText;
      this.plusButtons[key] = plus;

      this.statsPanel.add([minus, valText, plus]);
    }

    // --- Points panel ---
    this.add.text(width * 0.36, height * 0.62, 'Skill points', {
      fontFamily: 'Verdana, sans-serif', fontSize: '16px', color: '#9aa4b2'
    });
    this.pointsText = this.add.text(width * 0.40, height * 0.66, String(this.pointsRemaining), {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#e2c16b'
    });
    this.pointsPanel.add(this.pointsText!);

    // --- Stickman preview ---
    this.stickmanContainer = this.add.container(width * 0.77, height * 0.50);
    this.stickmanBody = this.add.graphics();
    this.stickmanHair = this.add.graphics();
    this.stickmanContainer.add([this.stickmanBody, this.stickmanHair]);
    this.rightPanel.add(this.stickmanContainer);
    this.redrawStickman();

    // --- Confirm / Cancel buttons ---
    this.confirmBtn = makeRoundButton(this, width * 0.85, height * 0.88, 36, 0x12a150, '✓', () => this.onConfirm());
    this.cancelBtn = makeRoundButton(this, width * 0.90, height * 0.88, 36, 0xaa3d3d, '✗', () => this.onCancel());

    this.updateButtonsEnabled();
    this.updateConfirmEnabled();

    // --- Escape: back to Main Menu ---
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });

    // Handle resize
    this.scale.on('resize', () => this.scene.restart());
  }

  // ---------- STAT LOGIC ----------
  private incStat(key: StatKey) {
    if (this.pointsRemaining <= 0) return;
    this.stats[key] += 1;
    this.pointsRemaining -= 1;
    this.refreshStatsUI();
  }

  private decStat(key: StatKey) {
    if (this.stats[key] <= this.BASE) return;
    this.stats[key] -= 1;
    this.pointsRemaining += 1;
    this.refreshStatsUI();
  }

  private refreshStatsUI() {
    (Object.keys(this.stats) as StatKey[]).forEach(k => {
      this.statTexts[k]?.setText(String(this.stats[k]));
    });
    this.pointsText?.setText(String(this.pointsRemaining));
    this.updateButtonsEnabled();
    this.updateConfirmEnabled();
  }

  private updateButtonsEnabled() {
    const canPlus = this.pointsRemaining > 0;
    (Object.keys(this.stats) as StatKey[]).forEach(k => {
      setButtonEnabled(this.plusButtons[k]!, canPlus);
      const canMinus = this.stats[k] > this.BASE;
      setButtonEnabled(this.minusButtons[k]!, canMinus);
    });
  }

  private updateConfirmEnabled() {
    const valid = this.pointsRemaining === 0 && this.nameValue.length > 0;
    setButtonEnabled(this.confirmBtn!, valid);
  }

  // ---------- RANDOMIZE ----------
  private randomizeAll() {
    // Colors (avoid extremes to keep readable)
    const rc = () => Phaser.Math.Between(40, 235);
    this.skinRGB = { r: Phaser.Math.Between(180, 245), g: Phaser.Math.Between(140, 215), b: Phaser.Math.Between(110, 200) };
    this.hairRGB = { r: Phaser.Math.Between(10, 120), g: Phaser.Math.Between(10, 90), b: Phaser.Math.Between(10, 60) };

    this.skinSliderR?.setValue(this.skinRGB.r);
    this.skinSliderG?.setValue(this.skinRGB.g);
    this.skinSliderB?.setValue(this.skinRGB.b);
    this.hairSliderR?.setValue(this.hairRGB.r);
    this.hairSliderG?.setValue(this.hairRGB.g);
    this.hairSliderB?.setValue(this.hairRGB.b);

    // Hairstyle
    this.hairStyleIndex = Phaser.Math.Between(0, this.HAIR_STYLE_NAMES.length - 1);
    this.updateHairStyleLabel();

    // Stat distribution: start from BASE, distribute FREE_POINTS randomly
    const keys: StatKey[] = ['strength', 'dexterity', 'precision', 'guard', 'vitality', 'arcane'];
    keys.forEach(k => this.stats[k] = this.BASE);
    this.pointsRemaining = this.FREE_POINTS;
    for (let i = 0; i < this.FREE_POINTS; i++) {
      const k = Phaser.Utils.Array.GetRandom(keys);
      this.stats[k] += 1;
    }
    this.pointsRemaining = 0; // we just distributed all of them
    this.refreshStatsUI();

    this.redrawStickman();
  }

  private updateHairStyleLabel() {
    this.hairStyleLabel?.setText(this.HAIR_STYLE_NAMES[this.hairStyleIndex]);
  }

  // ---------- CONFIRM / CANCEL ----------
  private onConfirm() {
    if (this.pointsRemaining !== 0 || this.nameValue.length === 0) return;

    const data: CharacterData = {
      id: 'char-' + Date.now(),
      name: this.nameValue,
      appearance: {
        skinColor: rgbToHex(this.skinRGB.r, this.skinRGB.g, this.skinRGB.b),
        hairColor: rgbToHex(this.hairRGB.r, this.hairRGB.g, this.hairRGB.b),
        hairStyle: this.hairStyleIndex
      },
      stats: { ...this.stats },
      meta: { createdAt: new Date().toISOString(), version: 1 }
    };

    // Pass via scene transition parameter to OpenMap
    this.scene.start('OpenMap', { character: data });
  }

  private onCancel() {
    this.scene.start('MainMenu');
  }

  // ---------- STICKMAN RENDER ----------
  private redrawStickman() {
    if (!this.stickmanBody || !this.stickmanHair) return;

    const skinColor = rgbToHex(this.skinRGB.r, this.skinRGB.g, this.skinRGB.b);
    const hairColor = rgbToHex(this.hairRGB.r, this.hairRGB.g, this.hairRGB.b);

    // Clear
    this.stickmanBody.clear();
    this.stickmanHair.clear();

    // Scale factors
    const scale = 1.2;
    const centerX = 0;
    const baseY = 80;

    const g = this.stickmanBody;
    g.fillStyle(skinColor, 1);
    g.lineStyle(4, 0x222222, 1);

    // Head
    g.fillCircle(centerX, baseY - 120 * scale, 26 * scale);
    g.strokeCircle(centerX, baseY - 120 * scale, 26 * scale);

    // Torso (simple chest/abdomen)
    g.strokeRoundedRect(centerX - 30 * scale, baseY - 110 * scale, 60 * scale, 70 * scale, 12 * scale);
    g.strokeRoundedRect(centerX - 20 * scale, baseY - 40 * scale, 40 * scale, 40 * scale, 10 * scale);

    // Arms
    g.strokePath();
    g.beginPath();
    g.moveTo(centerX - 30 * scale, baseY - 105 * scale);
    g.lineTo(centerX - 50 * scale, baseY - 60 * scale);
    g.lineTo(centerX - 40 * scale, baseY - 20 * scale);

    g.moveTo(centerX + 30 * scale, baseY - 105 * scale);
    g.lineTo(centerX + 50 * scale, baseY - 60 * scale);
    g.lineTo(centerX + 40 * scale, baseY - 20 * scale);
    g.strokePath();

    // Legs
    g.beginPath();
    g.moveTo(centerX - 10 * scale, baseY);
    g.lineTo(centerX - 20 * scale, baseY + 50 * scale);
    g.moveTo(centerX + 10 * scale, baseY);
    g.lineTo(centerX + 20 * scale, baseY + 50 * scale);
    g.strokePath();

    // Shorts
    g.fillStyle(0xc7493a, 1);
    g.fillRoundedRect(centerX - 20 * scale, baseY - 10 * scale, 40 * scale, 20 * scale, 6 * scale);

    // Hair (separate layer, filled with hairColor)
    const h = this.stickmanHair;
    h.clear();
    h.fillStyle(hairColor, 1);

    const headX = centerX;
    const headY = baseY - 120 * scale;
    const r = 28 * scale;

    switch (this.hairStyleIndex) {
      case 0: // Bald: nothing
        break;
      case 1: // Buzz: tight cap
        drawCap(h, headX, headY, r, 0.6);
        break;
      case 2: // Spiky
        drawSpikes(h, headX, headY - r * 0.9, r * 1.1, 6);
        break;
      case 3: // Mohawk
        drawMohawk(h, headX, headY - r, r * 1.2, 6);
        break;
      case 4: // Side-sweep
        drawSweep(h, headX, headY - r * 0.6, r * 1.1);
        break;
    }
  }
}

// ---------- Helpers (UI + drawing) ----------

function textSmallStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Verdana, sans-serif',
    fontSize: '16px',
    color: '#9aa4b2'
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

// Simple rectangular text button
function makeButton(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  label: string, onClick: () => void
): Phaser.GameObjects.Container {
  const bg = scene.add.rectangle(0, 0, w, h, 0x1c2740, 1).setStrokeStyle(2, 0x2a3a5f).setOrigin(0, 0);
  const txt = scene.add.text(w / 2, h / 2, label, { fontFamily: 'Verdana', fontSize: '16px', color: '#e0e6f0' }).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, txt]).setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
  container.on('pointerover', () => { bg.setFillStyle(0x253556); });
  container.on('pointerout', () => { bg.setFillStyle(0x1c2740); });
  container.on('pointerdown', () => { onClick(); });
  return container;
}

// Small icon button (◀ ▶ + / –)
function makeIconButton(
  scene: Phaser.Scene,
  x: number, y: number, glyph: string, onClick: () => void
): Phaser.GameObjects.Container {
  const w = 28, h = 28;
  const bg = scene.add.rectangle(0, 0, w, h, 0x1c2740, 1).setStrokeStyle(2, 0x2a3a5f).setOrigin(0, 0);
  const txt = scene.add.text(w / 2, h / 2 - 2, glyph, { fontFamily: 'Verdana', fontSize: '20px', color: '#e0e6f0' }).setOrigin(0.5);
  const c = scene.add.container(x, y, [bg, txt]).setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
  c.on('pointerover', () => { bg.setFillStyle(0x253556); });
  c.on('pointerout', () => { bg.setFillStyle(0x1c2740); });
  c.on('pointerdown', () => { onClick(); });
  return c;
}

// Round confirm/cancel button
function makeRoundButton(
  scene: Phaser.Scene,
  x: number, y: number, radius: number, color: number, glyph: string, onClick: () => void
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  drawCircle(g, 0, 0, radius, color, 0x2a3a5f);
  const txt = scene.add.text(0, -2, glyph, { fontFamily: 'Verdana', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
  const c = scene.add.container(x, y, [g, txt]).setSize(radius * 2, radius * 2)
    .setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);
  c.on('pointerover', () => { g.clear(); drawCircle(g, 0, 0, radius, Phaser.Display.Color.IntegerToColor(color).darken(10).color, 0x395080); });
  c.on('pointerout', () => { g.clear(); drawCircle(g, 0, 0, radius, color, 0x2a3a5f); });
  c.on('pointerdown', () => { onClick(); });
  return c;
}

function drawCircle(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, fill: number, stroke: number) {
  g.fillStyle(fill, 1);
  g.lineStyle(2, stroke, 1);
  g.fillCircle(x, y, r);
  g.strokeCircle(x, y, r);
}

// Enable/disable look for buttons (dim + disable input)
function setButtonEnabled(container: Phaser.GameObjects.Container, enabled: boolean) {
  container.setAlpha(enabled ? 1 : 0.45);
  container.list.forEach(child => child.disableInteractive?.());
  if (enabled) {
    container.setInteractive();
  } else {
    container.disableInteractive();
  }
}

// ---------- Slider component ----------
class Slider {
  public container: Phaser.GameObjects.Container;
  private track: Phaser.GameObjects.Rectangle;
  private thumb: Phaser.GameObjects.Rectangle;
  private width: number;
  private onChange: (value: number) => void;
  private value: number; // 0..255

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, color: number, initial: number, onChange: (value: number) => void) {
    this.width = width;
    this.onChange = onChange;
    this.value = Phaser.Math.Clamp(initial, 0, 255);

    this.track = scene.add.rectangle(0, 0, width, 6, 0x233255).setOrigin(0, 0.5);
    const thumbColor = Phaser.Display.Color.IntegerToColor(color).brighten(10).color;
    this.thumb = scene.add.rectangle(0, 0, 12, 18, thumbColor).setOrigin(0.5);
    this.thumb.setStrokeStyle(2, 0x2a3a5f);

    this.container = scene.add.container(x, y, [this.track, this.thumb]).setSize(width, 20);
    this.container.setInteractive(new Phaser.Geom.Rectangle(0, -10, width, 20), Phaser.Geom.Rectangle.Contains);
    this.container.on('pointerdown', (p: Phaser.Input.Pointer) => this.setFromPointer(p));
    this.container.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown) this.setFromPointer(p); });

    this.layoutThumb();
  }

  setValue(v: number) {
    this.value = Phaser.Math.Clamp(v, 0, 255);
    this.layoutThumb();
    this.onChange(this.value);
  }

  private setFromPointer(p: Phaser.Input.Pointer) {
    const localX = p.x - (this.container.x);
    const clamped = Phaser.Math.Clamp(localX, 0, this.width);
    const v = Math.round((clamped / this.width) * 255);
    this.value = v;
    this.layoutThumb();
    this.onChange(this.value);
  }

  private layoutThumb() {
    this.thumb.x = (this.value / 255) * this.width;
  }
}

// ---------- Hair drawing helpers ----------
function drawCap(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, coverage: number) {
  // Semi-circle cap
  g.beginPath();
  g.arc(x, y, r, Math.PI, Math.PI * (2 - coverage), false);
  g.lineTo(x, y);
  g.closePath();
  g.fillPath();
}

function drawSpikes(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, spikes: number) {
  const step = w / spikes;
  let px = x - w / 2;
  g.beginPath();
  for (let i = 0; i < spikes; i++) {
    g.moveTo(px, y);
    g.lineTo(px + step / 2, y - Phaser.Math.Between(12, 16));
    g.lineTo(px + step, y);
    px += step;
  }
  g.closePath();
  g.fillPath();
}

function drawMohawk(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, spikes: number) {
  const step = w / spikes;
  let px = x - w / 2;
  g.beginPath();
  for (let i = 0; i < spikes; i++) {
    g.moveTo(px, y);
    g.lineTo(px + step / 2, y - 18);
    g.lineTo(px + step, y);
    px += step;
  }
  g.closePath();
  g.fillPath();
}

function drawSweep(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number) {
  g.fillStyle(g.defaultFillColor, 1);
  g.beginPath();
  g.moveTo(x - w * 0.5, y);
  (g as any).quadraticCurveTo(x + w * 0.05, y - 14, x + w * 0.45, y - 2);
  (g as any).quadraticCurveTo(x + w * 0.25, y + 4, x - w * 0.2, y + 6);
  g.closePath();
  g.fillPath();
}