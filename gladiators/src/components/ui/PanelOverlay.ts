// src/components/ui/PanelOverlay.ts
import Phaser from 'phaser';

interface PanelOverlayConfig {
    title: string;
    width?: number;   // defaults to 500
    height?: number;  // defaults to 400
}

export class PanelOverlay extends Phaser.GameObjects.Container {
    public contentContainer: Phaser.GameObjects.Container;
    private backdrop: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, config: PanelOverlayConfig) {
        const { width, height } = scene.scale;
        super(scene, 0, 0);

        const panelW = config.width  ?? 500;
        const panelH = config.height ?? 400;
        const panelX = (width  - panelW) / 2;
        const panelY = (height - panelH) / 2;

        // 1. Full-screen dark backdrop — blocks clicks reaching the scene below
        this.backdrop = scene.add.rectangle(0, 0, width, height, 0x000000, 0.75)
            .setOrigin(0, 0)
            .setInteractive(); // swallows pointer events so the map/combat isn't clickable while open
        this.add(this.backdrop);

        // 2. Panel background
        const panel = scene.add.rectangle(panelX, panelY, panelW, panelH, 0x0f172a)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x334155);
        this.add(panel);

        // 3. Title bar strip
        const titleBar = scene.add.rectangle(panelX, panelY, panelW, 44, 0x1e293b)
            .setOrigin(0, 0);
        this.add(titleBar);

        // 4. Title text
        const titleText = scene.add.text(panelX + 20, panelY + 22, config.title, {
            fontFamily: 'Verdana',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        this.add(titleText);

        // 5. Close button — top right corner of panel
        const closeBtn = scene.add.text(panelX + panelW - 20, panelY + 22, '✕', {
            fontFamily: 'Verdana',
            fontSize: '16px',
            color: '#94a3b8'
        })
        .setOrigin(1, 0.5)
        .setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#94a3b8'));
        closeBtn.on('pointerdown', () => this.close());
        this.add(closeBtn);

        // 6. Content container — callers add their own objects here
        // Offset below the title bar so content never overlaps it
        this.contentContainer = scene.add.container(panelX + 20, panelY + 60);
        this.add(this.contentContainer);

        // 7. Fade in
        this.setAlpha(0);
        scene.tweens.add({ targets: this, alpha: 1, duration: 150, ease: 'Sine.easeOut' });

        scene.add.existing(this);
    }

    // Fade out then destroy — callers can optionally pass a callback
    public close(onComplete?: () => void) {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 120,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.destroy();
                onComplete?.();
            }
        });
    }
}