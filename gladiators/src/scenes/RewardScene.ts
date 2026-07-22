// src/scenes/RewardScene.ts
import Phaser from 'phaser';
import { SceneKeys } from '../data/SceneKeys';
import { usePlayerStore } from '../data/PlayerData';
import { RewardGenerator, type RewardCard, type EnemyTier } from '../utils/RewardGenerator';
import type { EnemyTemplate } from '../data/Enemy/EnemyArchetypes';

interface RewardPayload {
    enemyTemplate: EnemyTemplate;
}

export default class RewardScene extends Phaser.Scene {
    constructor() {
        super(SceneKeys.RewardScene);
    }

    create(data: RewardPayload) {
        const { width, height } = this.scale;
        const store = usePlayerStore.getState();
        const tier = (data.enemyTemplate.tier?.toLowerCase() ?? 'beginner') as EnemyTier;

        // 1. Award base gold immediately
        const baseGold = RewardGenerator.rollGold(tier);
        store.addGold(baseGold);

        // 2. Generate the 3 reward cards
        const cards = RewardGenerator.generateCards(tier);

        // 3. Draw the screen
        this.add.rectangle(0, 0, width, height, 0x07080d).setOrigin(0);

        this.add.text(width / 2, 60, 'VICTORY', {
            fontFamily: 'Verdana', fontSize: '36px',
            color: '#fbbf24', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 110, `You earned ${baseGold} gold!`, {
            fontFamily: 'Verdana', fontSize: '18px', color: '#9aa4b2'
        }).setOrigin(0.5);

        this.add.text(width / 2, 155, 'Choose a reward:', {
            fontFamily: 'Verdana', fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        // 4. Draw the 3 cards
        const cardWidth = 220;
        const cardHeight = 280;
        const gap = 40;
        const totalWidth = (cardWidth * 3) + (gap * 2);
        const startX = (width - totalWidth) / 2;
        const cardY = height / 2;

        cards.forEach((card, index) => {
            const x = startX + (index * (cardWidth + gap)) + cardWidth / 2;
            this.drawRewardCard(x, cardY, cardWidth, cardHeight, card, store, tier);
        });
    }

    private drawRewardCard(
        x: number, y: number,
        w: number, h: number,
        card: RewardCard,
        store: ReturnType<typeof usePlayerStore.getState>,
        tier: EnemyTier
    ) {
        const bg = this.add.rectangle(x, y, w, h, 0x1a2035)
            .setStrokeStyle(2, 0x3b4a6b)
            .setInteractive({ useHandCursor: true });

        const typeColors: Record<string, string> = {
            equipment: '#a78bfa',
            healing:   '#34d399',
            money:     '#fbbf24'
        };

        const typeIcons: Record<string, string> = {
            equipment: '⚔️',
            healing:   '❤️',
            money:     '🪙'
        };

        this.add.text(x, y - 90, typeIcons[card.type], { fontSize: '36px' }).setOrigin(0.5);

        this.add.text(x, y - 40, card.label, {
            fontFamily: 'Verdana', fontSize: '16px',
            color: typeColors[card.type], fontStyle: 'bold',
            wordWrap: { width: w - 20 }, align: 'center'
        }).setOrigin(0.5);

        this.add.text(x, y + 20, card.description, {
            fontFamily: 'Verdana', fontSize: '13px',
            color: '#9aa4b2', wordWrap: { width: w - 20 }, align: 'center'
        }).setOrigin(0.5);

        // Hover effect
        bg.on('pointerover', () => bg.setStrokeStyle(2, 0x7c86ff));
        bg.on('pointerout',  () => bg.setStrokeStyle(2, 0x3b4a6b));

        // Pick handler
        bg.on('pointerdown', () => {
            this.applyReward(card, store);
            this.cameras.main.fadeOut(250, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(SceneKeys.OpenMap);
            });
        });
    }

    private applyReward(
        card: RewardCard,
        store: ReturnType<typeof usePlayerStore.getState>
    ) {
        switch (card.type) {
            case 'equipment':
                if (card.equipment) {
                    // For now just log it — proper equip UI comes later
                    console.log('Received equipment:', card.equipment.name);
                    // store.addToInventory(card.equipment); ← wire up when inventory exists
                }
                break;

            case 'healing':
                if (card.healAmount !== undefined) {
                    const hp = store.secondaryStats.hp;
                    const restored = Math.floor(hp.max * card.healAmount);
                    store.updateSecondaryStats({
                        hp: {
                            ...hp,
                            current: Math.min(hp.max, hp.current + restored)
                        }
                    });
                }
                break;

            case 'money':
                if (card.goldAmount !== undefined) {
                    store.addGold(card.goldAmount);
                }
                break;
        }
    }
}