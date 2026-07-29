// src/scenes/RewardScene.ts
import Phaser from 'phaser';
import { SceneKeys } from '../data/SceneKeys';
import { usePlayerStore, type PlayerData } from '../data/PlayerData';
import { RewardGenerator, type RewardCard, type EnemyTier } from '../utils/RewardGenerator';
import { StatCalculator } from '../utils/StatCalculator';
import type { Equipment } from '../data/Equipment/EquipmentTypes';
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

        const baseGold = RewardGenerator.rollGold(tier);
        store.addGold(baseGold);

        const cards = RewardGenerator.generateCards(tier);

        this.add.rectangle(0, 0, width, height, 0x07080d).setOrigin(0);

        this.add.text(width / 2, 60, 'VICTORY', {
            fontFamily: 'Verdana', fontSize: '36px', color: '#fbbf24', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 110, `You earned ${baseGold} gold!`, {
            fontFamily: 'Verdana', fontSize: '18px', color: '#9aa4b2'
        }).setOrigin(0.5);

        this.add.text(width / 2, 155, 'Choose a reward:', {
            fontFamily: 'Verdana', fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        const cardWidth = 220;
        const cardHeight = 280;
        const gap = 40;
        const totalWidth = (cardWidth * 3) + (gap * 2);
        const startX = (width - totalWidth) / 2;
        const cardY = height / 2;

        cards.forEach((card, index) => {
            const x = startX + (index * (cardWidth + gap)) + cardWidth / 2;
            this.drawRewardCard(x, cardY, cardWidth, cardHeight, card, store);
        });
    }

    private drawRewardCard(
        x: number, y: number,
        w: number, h: number,
        card: RewardCard,
        store: ReturnType<typeof usePlayerStore.getState>
    ) {
        const bg = this.add.rectangle(x, y, w, h, 0x1a2035)
            .setStrokeStyle(2, 0x3b4a6b)
            .setInteractive({ useHandCursor: true });

        const typeColors: Record<string, string> = {
            equipment: '#a78bfa', healing: '#34d399', money: '#fbbf24'
        };
        const typeIcons: Record<string, string> = {
            equipment: '⚔️', healing: '❤️', money: '🪙'
        };

        this.add.text(x, y - 90, typeIcons[card.type], { fontSize: '36px' }).setOrigin(0.5);

        this.add.text(x, y - 40, card.label, {
            fontFamily: 'Verdana', fontSize: '16px', color: typeColors[card.type],
            fontStyle: 'bold', wordWrap: { width: w - 20 }, align: 'center'
        }).setOrigin(0.5);

        this.add.text(x, y + 20, card.description, {
            fontFamily: 'Verdana', fontSize: '13px', color: '#9aa4b2',
            wordWrap: { width: w - 20 }, align: 'center'
        }).setOrigin(0.5);

        // 🔥 NEW: show rarity and slot info for equipment cards
        if (card.type === 'equipment' && card.equipment) {
            const rarityColors: Record<string, string> = {
                common: '#9ca3af', uncommon: '#34d399', rare: '#60a5fa', legendary: '#f59e0b'
            };
            this.add.text(x, y + 70, `${card.equipment.rarity.toUpperCase()} ${card.equipment.slot.toUpperCase()}`, {
                fontFamily: 'Verdana', fontSize: '11px',
                color: rarityColors[card.equipment.rarity] ?? '#ffffff',
                letterSpacing: 1
            }).setOrigin(0.5);

            // Show stat modifiers on the card
            const modLines = card.equipment.modifiers
                .map(m => `${m.value > 0 ? '+' : ''}${m.value} ${m.stat}`)
                .join('   ');
            this.add.text(x, y + 95, modLines, {
                fontFamily: 'Verdana', fontSize: '11px', color: '#94a3b8', align: 'center'
            }).setOrigin(0.5);
        }

        bg.on('pointerover', () => bg.setStrokeStyle(2, 0x7c86ff));
        bg.on('pointerout', () => bg.setStrokeStyle(2, 0x3b4a6b));

        bg.on('pointerdown', () => {
            this.handleCardPick(card, store);
        });
    }


    private handleCardPick(
        card: RewardCard,
        store: ReturnType<typeof usePlayerStore.getState>
    ) {
        if (card.type === 'equipment' && card.equipment) {
            const currentItem = store.equipment[card.equipment.slot];

            if (!currentItem) {
                store.equipItem(card.equipment);
                this.recalculateSecondaryStats(store); // 🔥 NEW
                this.exitToMap();
            } else {
                this.showEquipComparison(currentItem, card.equipment, store);
            }
            return;
        }

        this.applyNonEquipmentReward(card, store);
        this.exitToMap();
    }

    // 🔥 NEW: comparison overlay — keep current or swap
    private showEquipComparison(
        current: Equipment,
        incoming: Equipment,
        store: ReturnType<typeof usePlayerStore.getState>
    ) {
        const { width, height } = this.scale;
        const player = store as any; // access player stats for requirement check

        const overlay = this.add.container(0, 0).setDepth(50);

        // Dim background
        overlay.add(
            this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0)
        );

        // Panel background
        const panelW = 560;
        const panelH = 420;
        const panelX = (width - panelW) / 2;
        const panelY = (height - panelH) / 2;

        overlay.add(
            this.add.rectangle(panelX, panelY, panelW, panelH, 0x0f172a)
                .setOrigin(0, 0)
                .setStrokeStyle(1, 0x334155)
        );

        overlay.add(
            this.add.text(width / 2, panelY + 24, 'CHOOSE YOUR EQUIPMENT', {
                fontFamily: 'Verdana', fontSize: '16px',
                color: '#ffffff', fontStyle: 'bold', letterSpacing: 2
            }).setOrigin(0.5, 0)
        );

        // Draw both item cards side by side
        const leftX = panelX + panelW * 0.25;
        const rightX = panelX + panelW * 0.75;
        const itemY = panelY + 70;

        this.drawItemComparison(overlay, leftX, itemY, current, 'CURRENT', true, store);
        this.drawItemComparison(overlay, rightX, itemY, incoming, 'INCOMING', false, store);

        // VS divider
        overlay.add(
            this.add.text(width / 2, panelY + 190, 'VS', {
                fontFamily: 'Verdana', fontSize: '20px', color: '#7e87a2', fontStyle: 'italic'
            }).setOrigin(0.5)
        );

        // KEEP button — keep current, discard incoming
        const keepBtn = this.add.rectangle(leftX, panelY + panelH - 50, 180, 44, 0x1e3a5f)
            .setStrokeStyle(2, 0x3b82f6)
            .setInteractive({ useHandCursor: true });
        const keepLabel = this.add.text(leftX, panelY + panelH - 50, 'KEEP CURRENT', {
            fontFamily: 'Verdana', fontSize: '13px', color: '#3b82f6', fontStyle: 'bold'
        }).setOrigin(0.5);

        keepBtn.on('pointerover', () => keepBtn.setFillStyle(0x2a4a7f));
        keepBtn.on('pointerout', () => keepBtn.setFillStyle(0x1e3a5f));
        keepBtn.on('pointerdown', () => {
            // Discard incoming, keep current — just leave
            overlay.destroy();
            this.exitToMap();
        });

        // SWAP button — equip incoming, discard current
        const swapBtn = this.add.rectangle(rightX, panelY + panelH - 50, 180, 44, 0x7f1d1d)
            .setStrokeStyle(2, 0xef4444)
            .setInteractive({ useHandCursor: true });
        const swapLabel = this.add.text(rightX, panelY + panelH - 50, 'TAKE NEW', {
            fontFamily: 'Verdana', fontSize: '13px', color: '#ef4444', fontStyle: 'bold'
        }).setOrigin(0.5);

        swapBtn.on('pointerover', () => swapBtn.setFillStyle(0x991b1b));
        swapBtn.on('pointerout', () => swapBtn.setFillStyle(0x7f1d1d));
        swapBtn.on('pointerdown', () => {
            store.equipItem(incoming);
            this.recalculateSecondaryStats(store); // 🔥 NEW
            overlay.destroy();
            this.exitToMap();
        });

        overlay.add([keepBtn, keepLabel, swapBtn, swapLabel]);
    }

    // 🔥 NEW: recalculates HP and stamina max after equipment changes
    // Also adjusts current values by the same delta so player doesn't
    // suddenly have less HP than max after equipping
    private recalculateSecondaryStats(
        store: ReturnType<typeof usePlayerStore.getState>
    ) {
        const player = usePlayerStore.getState() as PlayerData;

        const newMaxHp = StatCalculator.getEffectiveMaxHp(player);
        const newMaxStamina = StatCalculator.getEffectiveMaxStamina(player);

        const hpDelta = newMaxHp - player.secondaryStats.hp.max;
        const staminaDelta = newMaxStamina - player.secondaryStats.stamina.max;

        store.updateSecondaryStats({
            hp: {
                max: newMaxHp,
                // If vitality went up, current also increases by the same delta
                // If vitality went down (unlikely but possible), current is capped at new max
                current: Math.min(player.secondaryStats.hp.current + hpDelta, newMaxHp)
            },
            stamina: {
                max: newMaxStamina,
                current: Math.min(player.secondaryStats.stamina.current + staminaDelta, newMaxStamina)
            }
        });
    }

    // 🔥 NEW: draws one item card inside the comparison overlay
    private drawItemComparison(
        overlay: Phaser.GameObjects.Container,
        x: number,
        y: number,
        item: Equipment,
        tag: string,
        isCurrent: boolean,
        store: ReturnType<typeof usePlayerStore.getState>
    ) {
        const cardW = 220;
        const cardH = 240;

        // Card background
        const borderColor = isCurrent ? 0x3b82f6 : 0xef4444;
        overlay.add(
            this.add.rectangle(x, y + cardH / 2, cardW, cardH, 0x1a2035)
                .setStrokeStyle(2, borderColor)
                .setOrigin(0.5)
        );

        // Tag — CURRENT / INCOMING
        const tagColor = isCurrent ? '#3b82f6' : '#ef4444';
        overlay.add(
            this.add.text(x, y + 14, tag, {
                fontFamily: 'Verdana', fontSize: '11px',
                color: tagColor, fontStyle: 'bold', letterSpacing: 2
            }).setOrigin(0.5)
        );

        // Item name
        const rarityColors: Record<string, string> = {
            common: '#9ca3af', uncommon: '#34d399', rare: '#60a5fa', legendary: '#f59e0b'
        };
        overlay.add(
            this.add.text(x, y + 40, item.name, {
                fontFamily: 'Verdana', fontSize: '15px',
                color: rarityColors[item.rarity] ?? '#ffffff', fontStyle: 'bold',
                align: 'center', wordWrap: { width: cardW - 20 }
            }).setOrigin(0.5)
        );

        // Description
        overlay.add(
            this.add.text(x, y + 68, item.description, {
                fontFamily: 'Verdana', fontSize: '11px', color: '#64748b',
                align: 'center', wordWrap: { width: cardW - 24 }
            }).setOrigin(0.5)
        );

        // Modifiers
        let modY = y + 100;
        item.modifiers.forEach(mod => {
            const isPositive = mod.value > 0;
            overlay.add(
                this.add.text(x, modY,
                    `${isPositive ? '+' : ''}${mod.value} ${mod.stat}`, {
                    fontFamily: 'Verdana', fontSize: '12px',
                    color: isPositive ? '#34d399' : '#ef4444'
                }).setOrigin(0.5)
            );
            modY += 18;
        });

        // Requirement
        if (item.requirement) {
            const playerStat = store.stats[item.requirement.stat as keyof typeof store.stats] ?? 0;
            const met = playerStat >= item.requirement.value;
            overlay.add(
                this.add.text(x, y + 190,
                    `${met ? '✓' : '✗'} Req: ${item.requirement.stat} ${item.requirement.value}`, {
                    fontFamily: 'Verdana', fontSize: '11px',
                    color: met ? '#34d399' : '#ef4444'
                }).setOrigin(0.5)
            );

            if (!met) {
                const penalty = StatCalculator.getRequirementPenalty(store as any, item);
                overlay.add(
                    this.add.text(x, y + 208, `Penalty: +${penalty} stamina/attack`, {
                        fontFamily: 'Verdana', fontSize: '10px', color: '#f59e0b'
                    }).setOrigin(0.5)
                );
            }
        }
    }

    private applyNonEquipmentReward(
        card: RewardCard,
        store: ReturnType<typeof usePlayerStore.getState>
    ) {
        switch (card.type) {
            case 'healing':
                if (card.healAmount !== undefined) {
                    const hp = store.secondaryStats.hp;
                    const restored = Math.floor(hp.max * card.healAmount);
                    store.updateSecondaryStats({
                        hp: { ...hp, current: Math.min(hp.max, hp.current + restored) }
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

    private exitToMap() {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start(SceneKeys.OpenMap);
        });
    }
}