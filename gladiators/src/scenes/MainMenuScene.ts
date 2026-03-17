// src/scenes/MainMenuScene.ts
import Phaser from "phaser";

type MenuEntry = {
  label: string;
  action: () => void;
};

export default class MainMenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private menuEntries: MenuEntry[] = [];
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;

  constructor() {
    super("MainMenu");
  }

  preload() {
    // (Optional) Load UI images, audio, or custom fonts here.
    // this.load.audio('ui-move', 'assets/audio/ui-move.ogg');
    // this.load.audio('ui-select', 'assets/audio/ui-select.ogg');
  }

  async create() {
    const { width, height } = this.scale;

    await document.fonts.ready; // Ensure fonts are loaded before creating text objects

    // Background
    this.cameras.main.setBackgroundColor(0x101322);
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // Title
    this.titleText = this.add
      .text(width / 2, height * 0.22, "KNEWTON KNOCKOUT", {
        fontFamily: "Greconian, sans-serif",
        fontSize: "70px",
        color: "#f0e6d2",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Build the 3 options from your flowchart
    this.menuEntries = [
      {
        label: "New Game",
        action: () => {
          // Flowchart: New Game → Go to Character Creation Screen
          this.transitionTo("CharacterCreate");
        },
      },
      {
        label: "How to Play",
        action: () => {
          // Flowchart: View "How to Play" Page
          this.transitionTo("HowToPlay");
        },
      },
      {
        label: "Credits",
        action: () => {
          // Flowchart: View "Credits" Page
          this.transitionTo("Credits");
        },
      },
    ];

    // Menu UI
    const startY = height * 0.45;
    const line = 58;

    this.menuTexts = this.menuEntries.map((entry, i) => {
      const t = this.add
        .text(width / 2, startY + i * line, entry.label, {
          fontFamily: "sans-serif",
          fontSize: "28px",
          color: "#d5d9e3",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      // Mouse interactions
      t.on("pointerover", () => this.setSelectedIndex(i));
      t.on("pointerdown", () => this.activateSelected());
      return t;
    });

    // Footer hint
    this.hintText = this.add
      .text(width / 2, height * 0.88, "↑/↓ to navigate • Enter/Click to select", {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#9aa4b2",
      })
      .setOrigin(0.5);

    // Keyboard navigation
    this.input.keyboard?.on("keydown-UP", () => this.moveSelection(-1));
    this.input.keyboard?.on("keydown-DOWN", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-W", () => this.moveSelection(-1));
    this.input.keyboard?.on("keydown-S", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-ENTER", () => this.activateSelected());
    this.input.keyboard?.on("keydown-SPACE", () => this.activateSelected());

    // Initialize selection
    this.setSelectedIndex(0);
  }

  // ----- Helpers -----

  private moveSelection(delta: number) {
    const max = this.menuEntries.length;
    this.selectedIndex = (this.selectedIndex + delta + max) % max;
    // this.sound.play('ui-move', { volume: 0.6 });
    this.updateHighlight();
  }

  private setSelectedIndex(i: number) {
    this.selectedIndex = i;
    this.updateHighlight();
  }

  private updateHighlight() {
    this.menuTexts.forEach((t, i) => {
      const sel = i === this.selectedIndex;
      t.setColor(sel ? "#ffffff" : "#d5d9e3");
      t.setFontStyle(sel ? "bold" : "normal");
      t.setScale(sel ? 1.06 : 1.0);
    });

    // Subtle title pulse on change
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.02,
      scaleY: 1.02,
      yoyo: true,
      duration: 120,
      ease: "sine.inout",
    });
  }

  private activateSelected() {
    const selected = this.menuEntries[this.selectedIndex];

    // Click feedback + then action
    this.tweens.add({
      targets: this.menuTexts[this.selectedIndex],
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 80,
      yoyo: true,
      ease: "quad.out",
      onComplete: () => {
        // this.sound.play('ui-select', { volume: 0.7 });
        selected.action();
      },
    });
  }

  private transitionTo(sceneKey: string) {
    // Simple fade-out then start next scene
    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey);
    });
  }
}
