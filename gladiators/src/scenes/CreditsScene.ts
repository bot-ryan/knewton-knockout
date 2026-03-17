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
    name: "Ryan Kristoffer Calipusan",
    role: "Game Design & Code",
    blurb: "Core gameplay, systems, and overall direction.",
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

  constructor() {
    super("Credits");
  }

  preload() {
    // Load slide images
    CREDIT_SLIDES.forEach(s => {
      // Safe to call multiple times; Phaser caches by key
      if (!this.textures.exists(s.imageKey)) {
        this.load.image(s.imageKey, s.imageURL);
      }
    });
  }

  async create() {
    const { width, height } = this.scale;

    // Background + fade
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
    this.add.text(width / 2, height - 18, "Press ESC to return • → or Click for next",
      { fontFamily: "sans-serif", fontSize: "14px", color: "#9aa4b2" }
    ).setOrigin(0.5, 1);

    // ----- Slide container (faded in/out between people) -----
    this.slideContainer = this.add.container(0, 0).setAlpha(0);

    // Layout calculations
    const pad = 32; // outer padding around the slide area
    const usableW = width - pad * 2;
    const usableH = height - 130 /* header space */ - 48 /* footer space */;
    const topY = 110; // top of the slide area, below header

    const leftW = usableW * this.leftWidthRatio;
    const rightW = usableW - leftW - this.innerMargin;

    // ---- Media (left) ----
    const mediaX = pad + leftW / 2;
    const mediaY = topY + usableH / 2;

    this.mediaImage = this.add.image(mediaX, mediaY, "__placeholder__")
      .setVisible(false);
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
    this.tweenIn();

    // Auto timer
    this.autoTimer = this.time.addEvent({
      delay: this.autoDelay,
      loop: true,
      callback: () => this.nextSlide(),
    });

    // Input: Next via Right Arrow or Click
    this.input.keyboard?.on("keydown-RIGHT", () => this.nextSlide(true));
    this.input.once("pointerdown", () => this.nextSlide(true));

    // Input: ESC to return anytime
    this.input.keyboard?.on("keydown-ESC", () => this.returnToMenu());

    // Clean up timer when leaving scene
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.autoTimer?.remove(false);
    });
  }

  // ---------- Slide helpers ----------

  private nextSlide(userTriggered = false) {
    if (this.transitioning) return;
    this.transitioning = true;

    // Reset auto timer when user advances
    if (userTriggered && this.autoTimer) {
      this.autoTimer.reset({ delay: this.autoDelay, loop: true });
    }

    this.tweenOut(() => {
      this.current = (this.current + 1) % CREDIT_SLIDES.length;
      this.applySlide(this.current);
      this.tweenIn();
    });
  }

  private applySlide(index: number) {
    const s = CREDIT_SLIDES[index];

    // Replace text
    this.nameText.setText(s.name);
    this.roleText.setText(s.role);
    this.blurbText.setText(s.blurb ?? "");

    // Replace image (and fit to left area box)
    if (this.textures.exists(s.imageKey)) {
      this.mediaImage.setTexture(s.imageKey).setVisible(true);

      // Fit image into left column area while preserving aspect ratio
      const { width, height } = this.scale;
      const pad = 32;
      const usableW = width - pad * 2;
      const usableH = height - 130 - 48;
      const leftW = usableW * this.leftWidthRatio;
      const leftH = usableH; // full column height

      const srcW = this.mediaImage.width;
      const srcH = this.mediaImage.height;
      const scale = Math.min(leftW / srcW, leftH / srcH, 1.0); // don't upscale beyond 1
      this.mediaImage.setScale(scale);
    } else {
      // If not loaded for some reason, hide the image
      this.mediaImage.setVisible(false);
    }
  }

  private tweenIn() {
    this.tweens.add({
      targets: this.slideContainer,
      alpha: 1,
      duration: this.fadeDur,
      ease: "quad.out",
      onComplete: () => (this.transitioning = false),
    });
  }

  private tweenOut(onComplete: () => void) {
    this.tweens.add({
      targets: this.slideContainer,
      alpha: 0,
      duration: this.fadeDur,
      ease: "quad.in",
      onComplete,
    });
  }

  private returnToMenu() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.autoTimer?.remove(false);

    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("MainMenu");
    });
  }
}