import Phaser from "phaser";
import { Fonts } from "../gameinit/Fonts";

type CreditSlide = {
  name: string;
  role: string;
  blurb?: string;
  imageKey: string;   // phaser key
  imageURL: string;   // served URL (e.g. /assets/credits/ryan.png)
};

// ---- EDIT ME: your credits data ----
const CREDIT_SLIDES: CreditSlide[] = [
  {
    name: "skippythedev",
    role: "Big Boss, Super Sigma Developer, \nLow Cortisol Teacher",
    blurb: "\nCore gameplay, systems, and overall direction.",
    imageKey: "ryan",
    imageURL: "/assets/credits/ryan.jpg",
  },
  {
    name: "Your Artist",
    role: "Art & UI",
    blurb: "Characters, UI, and promotional art.",
    imageKey: "artist",
    imageURL: "/assets/credits/artist.png",
  },
  {
    name: "Composer",
    role: "Music & SFX",
    blurb: "Score, ambience, and arena sounds.",
    imageKey: "composer",
    imageURL: "/assets/credits/composer.png",
  },
   {
    name: "Moike",
    role: "Support & Feedback",
    blurb: "He flies drones, very cool.",
    imageKey: "lian",
    imageURL: "/assets/credits/lian.jpeg",
  },
];

export default class CreditsScene extends Phaser.Scene {
  private slideContainer!: Phaser.GameObjects.Container;
  private mediaImage!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private roleText!: Phaser.GameObjects.Text;
  private blurbText!: Phaser.GameObjects.Text;

  private current = 0;
  private transitioning = false;
  private autoTimer?: Phaser.Time.TimerEvent;

  // layout
  private readonly autoDelay = 5000;         // ms
  private readonly fadeDur = 220;            // ms
  private readonly leftWidthRatio = 0.40;    // 40% for media, 60% for text
  private readonly innerMargin = 28;         // gap between media and text

  // Next button
  private nextBtn!: Phaser.GameObjects.Container;
  private nextBg!: Phaser.GameObjects.Rectangle;
  private nextLabel!: Phaser.GameObjects.Text;
  private nextEnabled = true;

  // Prev button
  private prevBtn!: Phaser.GameObjects.Container;
  private prevBg!: Phaser.GameObjects.Rectangle;
  private prevLabel!: Phaser.GameObjects.Text;
  private prevEnabled = true;

  constructor() {
    super("Credits");
  }

  preload() {
    CREDIT_SLIDES.forEach(s => {
      if (!this.textures.exists(s.imageKey)) {
        this.load.image(s.imageKey, s.imageURL);
      }
    });
  }

  async create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0e1a2b);
    this.cameras.main.fadeIn(150, 0, 0, 0);

    await document.fonts.ready;

    // ----- Header (static) -----
    this.add.text(width / 2, 68, "Credits", {
      fontFamily: Fonts.Title ?? "serif",
      fontSize: "52px",
      color: "#f0e6d2",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // ----- Footer hint (static) -----
    this.add.text(
      width / 2,
      height - 18,
      "Press ESC to return • ←/→ or Prev/Next buttons to navigate",
      { fontFamily: "sans-serif", fontSize: "14px", color: "#9aa4b2" }
    ).setOrigin(0.5, 1);

    // ----- Slide container (faded between people) -----
    this.slideContainer = this.add.container(0, 0).setAlpha(0);

    // Layout calc
    const pad = 32; // outer padding around the slide area
    const usableW = width - pad * 2;
    const usableH = height - 130 /* header space */ - 48 /* footer space */;
    const topY = 110;

    const leftW = usableW * this.leftWidthRatio;
    const rightW = usableW - leftW - this.innerMargin;

    // ---- Media (left) ----
    const mediaX = pad + leftW / 2;
    const mediaY = topY + usableH / 2;

    this.mediaImage = this.add.image(mediaX, mediaY, "__placeholder__").setVisible(false);
    this.slideContainer.add(this.mediaImage);

    // ---- Text (right) ----
    const rightX = pad + leftW + this.innerMargin + rightW / 2;
    const textTopY = topY;

    this.nameText = this.add.text(rightX, textTopY, "", {
      fontFamily: Fonts.Title ?? "serif",
      fontSize: "36px",
      color: "#f0e6d2",
      stroke: "#000000",
      strokeThickness: 3,
      align: "left",
      wordWrap: { width: rightW, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);
    this.slideContainer.add(this.nameText);

    this.roleText = this.add.text(rightX, textTopY + 50, "", {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: "#e5e7eb",
      fontStyle: "bold",
      align: "left",
      wordWrap: { width: rightW, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);
    this.slideContainer.add(this.roleText);

    this.blurbText = this.add.text(rightX, textTopY + 86, "", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#cfd6e4",
      align: "left",
      wordWrap: { width: rightW, useAdvancedWrap: true },
      lineSpacing: 4,
    }).setOrigin(0.5, 0);
    this.slideContainer.add(this.blurbText);

    // First slide
    this.applySlide(this.current);
    this.tweens.add({
      targets: this.slideContainer,
      alpha: 1,
      duration: this.fadeDur,
      ease: "quad.out",
    });

    // Auto timer
    this.autoTimer = this.time.addEvent({
      delay: this.autoDelay,
      loop: true,
      callback: () => this.nextSlide(),
    });

    // Keyboard: Next / Back to menu
    this.input.keyboard?.on("keydown-RIGHT", () => this.nextSlide(true));
    this.input.keyboard?.on("keydown-LEFT", () => this.prevSlide(true));
    this.input.keyboard?.on("keydown-ESC", () => this.returnToMenu());

    // --- Create NEXT button (bottom-right) ---
    this.createNextButton();

    // --- Create PREV button (bottom-left) ---
    this.createPrevButton();

    // Reposition UI on resize
    this.scale.on(Phaser.Scale.Events.RESIZE, (gameSize: Phaser.Structs.Size) => {
      this.layoutNextButton(gameSize.width, gameSize.height);
      this.layoutPrevButton(gameSize.width, gameSize.height);
    });

    // Clean timers on shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.autoTimer?.remove(false);
    });
  }

  update(_time: number, _delta: number) {
    // nothing; slides advance by timer or input
  }

  // ---------- Slide helpers ----------
  private nextSlide(userTriggered = false) {
    if (this.transitioning) return;
    this.transitioning = true;

    // Reset auto timer if user clicked the button or pressed arrow
    if (userTriggered && this.autoTimer) {
      this.autoTimer.reset({ delay: this.autoDelay, loop: true });
    }

    this.setNextEnabled(false);
    this.tweens.add({
      targets: this.slideContainer,
      alpha: 0,
      duration: this.fadeDur,
      ease: "quad.in",
      onComplete: () => {
        this.current = (this.current + 1) % CREDIT_SLIDES.length;
        this.applySlide(this.current);
        this.tweens.add({
          targets: this.slideContainer,
          alpha: 1,
          duration: this.fadeDur,
          ease: "quad.out",
          onComplete: () => {
            this.transitioning = false;
            this.setNextEnabled(true);
          },
        });
      },
    });
  }

  private prevSlide(userTriggered = false) {
    if (this.transitioning) return;
    this.transitioning = true;

    // Reset auto timer if user clicked the button or pressed arrow
    if (userTriggered && this.autoTimer) {
      this.autoTimer.reset({ delay: this.autoDelay, loop: true });
    }

    this.setPrevEnabled(false);
    this.tweens.add({
      targets: this.slideContainer,
      alpha: 0,
      duration: this.fadeDur,
      ease: "quad.in",
      onComplete: () => {
        this.current = (this.current - 1 + CREDIT_SLIDES.length) % CREDIT_SLIDES.length;
        this.applySlide(this.current);
        this.tweens.add({
          targets: this.slideContainer,
          alpha: 1,
          duration: this.fadeDur,
          ease: "quad.out",
          onComplete: () => {
            this.transitioning = false;
            this.setPrevEnabled(true);
          },
        });
      },
    });
  }

  private applySlide(index: number) {
    const s = CREDIT_SLIDES[index];

    // Replace text
    this.nameText.setText(s.name);
    this.roleText.setText(s.role);
    this.blurbText.setText(s.blurb ?? "");

    // Replace image (fit into left column)
    if (this.textures.exists(s.imageKey)) {
      this.mediaImage.setTexture(s.imageKey).setVisible(true);

      const { width, height } = this.scale;
      const pad = 32;
      const usableW = width - pad * 2;
      const usableH = height - 130 - 48;
      const leftW = usableW * this.leftWidthRatio;
      const leftH = usableH;

      const srcW = this.mediaImage.width;
      const srcH = this.mediaImage.height;
      const scale = Math.min(leftW / srcW, leftH / srcH, 1.0); // avoid upscaling blur
      this.mediaImage.setScale(scale);
    } else {
      this.mediaImage.setVisible(false);
    }
  }

  private returnToMenu() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.autoTimer?.remove(false);
    this.setNextEnabled(false);
    this.setPrevEnabled(false);

    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("MainMenu");
    });
  }

  // ---------- NEXT button ----------
  private createNextButton() {
    const { width, height } = this.scale;

    // Container
    this.nextBtn = this.add.container(0, 0).setDepth(9999);

    // Background (rounded rect)
    this.nextBg = this.add.rectangle(0, 0, 130, 40, 0x1f2937, 0.9)
      .setStrokeStyle(2, 0x374151, 1)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    // Label
    this.nextLabel = this.add.text(0, 0, "Next  ▷", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#e5e7eb",
    }).setOrigin(0.5);

    this.nextBtn.add([this.nextBg, this.nextLabel]);

    // Initial placement
    this.layoutNextButton(width, height);

    // Hover / press feedback
    this.nextBg.on("pointerover", () => {
      if (!this.nextEnabled) return;
      this.tweens.killTweensOf(this.nextBtn); // <--- Kills old tweens
      this.tweens.add({ targets: this.nextBtn, scale: 1.06, duration: 100, ease: "quad.out" });
    });
    this.nextBg.on("pointerout", () => {
      this.tweens.killTweensOf(this.nextBtn); // <--- Kills old tweens
      this.tweens.add({ targets: this.nextBtn, scale: 1.0, duration: 100, ease: "quad.out" });
    });
    this.nextBg.on("pointerdown", () => {
      if (!this.nextEnabled) return;
      this.tweens.killTweensOf(this.nextBtn); // <--- Kills old tweens
      this.tweens.add({ targets: this.nextBtn, scale: 0.96, duration: 60, yoyo: true, ease: "quad.out", 
        onComplete: () => {
            // Optional: ensure it snaps back to hover size if mouse is still on it
            this.tweens.add({ targets: this.nextBtn, scale: 1.06, duration: 60 });
        }
      });
      this.nextSlide(true);
    });
  }

  // ---------- PREV button ----------
  private createPrevButton() {
    const { width, height } = this.scale;

    // Container
    this.prevBtn = this.add.container(0, 0).setDepth(9999);

    // Background (rounded rect)
    this.prevBg = this.add.rectangle(0, 0, 130, 40, 0x1f2937, 0.9)
      .setStrokeStyle(2, 0x374151, 1)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    // Label
    this.prevLabel = this.add.text(0, 0, "◁  Prev", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#e5e7eb",
    }).setOrigin(0.5);

    this.prevBtn.add([this.prevBg, this.prevLabel]);

    // Initial placement
    this.layoutPrevButton(width, height);

    // Hover / press feedback
    this.prevBg.on("pointerover", () => {
      if (!this.prevEnabled) return;
      this.tweens.killTweensOf(this.prevBtn); // <--- Kills old tweens
      this.tweens.add({ targets: this.prevBtn, scale: 1.06, duration: 100, ease: "quad.out" });
    });
    this.prevBg.on("pointerout", () => {
      this.tweens.killTweensOf(this.prevBtn); // <--- Kills old tweens
      this.tweens.add({ targets: this.prevBtn, scale: 1.0, duration: 100, ease: "quad.out" });
    });
    this.prevBg.on("pointerdown", () => {
      if (!this.prevEnabled) return;
      this.tweens.killTweensOf(this.prevBtn); // <--- Kills old tweens
      this.tweens.add({ targets: this.prevBtn, scale: 0.96, duration: 60, yoyo: true, ease: "quad.out",
        onComplete: () => {
           this.tweens.add({ targets: this.prevBtn, scale: 1.06, duration: 60 });
        }
      });
      this.prevSlide(true);
    });
  }
  private layoutNextButton(width: number, height: number) {
    const margin = 22;
    const x = width - margin - (this.nextBg.width / 2);
    const y = height - margin - (this.nextBg.height / 2);
    this.nextBtn.setPosition(x, y);
  }

  private setNextEnabled(enabled: boolean) {
    this.nextEnabled = enabled;
    this.nextBg.setAlpha(enabled ? 0.9 : 0.4);
    this.nextBg.disableInteractive();
    if (enabled) this.nextBg.setInteractive({ useHandCursor: true });
  }

  private layoutPrevButton(width: number, height: number) {
    const margin = 22;
    const x = margin + (this.prevBg.width / 2);
    const y = height - margin - (this.prevBg.height / 2);
    this.prevBtn.setPosition(x, y);
  }

  private setPrevEnabled(enabled: boolean) {
    this.prevEnabled = enabled;
    this.prevBg.setAlpha(enabled ? 0.9 : 0.4);
    this.prevBg.disableInteractive();
    if (enabled) this.prevBg.setInteractive({ useHandCursor: true });
  }
}