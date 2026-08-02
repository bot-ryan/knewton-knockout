// src/scenes/ShopScene.ts
import Phaser from 'phaser';
import { SceneKeys } from '../data/SceneKeys';
import { usePlayerStore, type PlayerData } from '../data/PlayerData';
import { LogBox } from '../components/ui/LogBox';
import { ButtonCreator } from '../components/ButtonCreator';
import { PanelOverlay } from '../components/ui/PanelOverlay';
import { StatCalculator } from '../utils/StatCalculator';
import { ShopGenerator, type ShopItem } from '../utils/ShopGenerator';
import type { Equipment } from '../data/Equipment/EquipmentTypes';
import type { Relic } from '../data/Relics/RelicTypes';
import { type EnemyTier } from '../data/Equipment/EquipmentTypes';

// Placeholder relic pool — replace with your real pool when built
import { RELIC_POOL } from '../data/Relics/RelicPool';

interface ShopPayload {
    tier: EnemyTier;
}

export default class ShopScene extends Phaser.Scene {
    private player!: PlayerData;
    private logBox!: LogBox;
    private shopItems: ShopItem[] = [];
    private goldText!: Phaser.GameObjects.Text;

    constructor() { super(SceneKeys.ShopScene); }

    init(data: ShopPayload) {
        this.player = usePlayerStore.getState() as PlayerData;
        this.shopItems = ShopGenerator.generateShop(data?.tier ?? 'beginner', RELIC_POOL);
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x07080d);
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // --- HEADER ---
        this.add.text(width / 2, 36, 'SHOP', {
            fontFamily: 'Verdana', fontSize: '28px',
            color: '#e2c16b', fontStyle: 'bold', letterSpacing: 4
        }).setOrigin(0.5);

        this.goldText = this.add.text(width / 2, 70, '', {
            fontFamily: 'Verdana', fontSize: '16px', color: '#e2c16b'
        }).setOrigin(0.5);
        this.refreshGoldText();

        // --- LOGBOX ---
        this.logBox = new LogBox(this, 40, height - 130, width - 80, 100);

        // --- SECTION HEADERS ---
        const equipItems = this.shopItems.filter(i => i.type === 'equipment');
        const relicItems = this.shopItems.filter(i => i.type === 'relic');

        const colWeapon = width * 0.15;
        const colShield = width * 0.35;
        const colAccessory = width * 0.55;
        const colRelic = width * 0.78;
        const sectionY = 110;
        const itemStartY = 150;

        this.addSectionHeader('⚔️ WEAPONS', colWeapon, sectionY);
        this.addSectionHeader('🛡️ SHIELDS', colShield, sectionY);
        this.addSectionHeader('💍 ACCESSORIES', colAccessory, sectionY);
        this.addSectionHeader('✨ RELICS', colRelic, sectionY);

        // Vertical divider between equipment and relics
        const divider = this.add.graphics();
        divider.lineStyle(1, 0x1e293b, 1);
        divider.moveTo(width * 0.67, 100);
        divider.lineTo(width * 0.67, height - 140);
        divider.strokePath();

        // --- DRAW EQUIPMENT ITEMS ---
        const equipBySlot = {
            weapon: equipItems.filter(i => i.equipment?.slot === 'weapon'),
            shield: equipItems.filter(i => i.equipment?.slot === 'shield'),
            accessory: equipItems.filter(i => i.equipment?.slot === 'accessory')
        };

        this.drawEquipmentColumn(equipBySlot.weapon, colWeapon, itemStartY);
        this.drawEquipmentColumn(equipBySlot.shield, colShield, itemStartY);
        this.drawEquipmentColumn(equipBySlot.accessory, colAccessory, itemStartY);

        // --- DRAW RELIC ITEMS ---
        this.drawRelicColumn(relicItems, colRelic, itemStartY);

        // --- LEAVE BUTTON ---
        const leaveBtn = ButtonCreator.makeStandardButton(this, 'LEAVE SHOP', 180, 44, () => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(SceneKeys.OpenMap);
            });
        });
        leaveBtn.container.setPosition(width - 120, height - 180);
    }

    // --- DRAWING HELPERS ---

    private addSectionHeader(label: string, x: number, y: number) {
        this.add.text(x, y, label, {
            fontFamily: 'Verdana', fontSize: '13px',
            color: '#64748b', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);
    }

    private drawEquipmentColumn(items: ShopItem[], x: number, startY: number) {
        items.forEach((shopItem, index) => {
            const item = shopItem.equipment!;
            const y = startY + (index * 120);
            this.drawEquipmentCard(shopItem, item, x, y);
        });
    }

    private drawEquipmentCard(shopItem: ShopItem, item: Equipment, x: number, y: number) {
        const cardW = 180;
        const cardH = 100;
        const canAfford = this.player.gold >= shopItem.price;
        const isSold = shopItem.sold;

        // Card background
        const card = this.add.rectangle(x, y + cardH / 2, cardW, cardH, 0x0f172a)
            .setStrokeStyle(1, isSold ? 0x1e293b : 0x334155)
            .setOrigin(0.5)
            .setAlpha(isSold ? 0.4 : 1);

        // Rarity color strip at top
        const rarityColors: Record<string, number> = {
            common: 0x374151, uncommon: 0x065f46, rare: 0x1e3a5f, legendary: 0x78350f
        };
        this.add.rectangle(x, y + 4, cardW - 2, 4, rarityColors[item.rarity] ?? 0x374151)
            .setOrigin(0.5, 0)
            .setAlpha(isSold ? 0.4 : 1);

        // Item name
        const nameText = this.add.text(x, y + 18, item.name, {
            fontFamily: 'Verdana', fontSize: '13px',
            color: isSold ? '#374151' : '#ffffff', fontStyle: 'bold',
            wordWrap: { width: cardW - 16 }, align: 'center'
        }).setOrigin(0.5);

        // Modifier summary — one line
        const modSummary = item.modifiers
            .map(m => `${m.value > 0 ? '+' : ''}${m.value} ${m.stat}`)
            .join('  ');
        this.add.text(x, y + 48, modSummary, {
            fontFamily: 'Verdana', fontSize: '10px',
            color: isSold ? '#1e293b' : '#64748b', align: 'center'
        }).setOrigin(0.5);

        // Price
        const priceColor = isSold ? '#1e293b' : canAfford ? '#e2c16b' : '#ef4444';
        const priceLabel = isSold ? 'SOLD' : `🪙 ${shopItem.price}`;
        this.add.text(x, y + 78, priceLabel, {
            fontFamily: 'Verdana', fontSize: '13px',
            color: priceColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        if (!isSold) {
            // Hover — show details in logbox
            card.setInteractive({ useHandCursor: !isSold });
            nameText.setInteractive({ useHandCursor: true });

            const showDetail = () => {
                const meetsReq = StatCalculator.meetsRequirement(this.player, item);
                const reqLine = item.requirement
                    ? `${meetsReq ? '✓' : '✗'} Req: ${item.requirement.stat} ${item.requirement.value}`
                    : 'No requirement';
                const penalty = meetsReq ? '' : `Penalty: +${StatCalculator.getRequirementPenalty(this.player, item)} stamina/attack`;
                const lines = [
                    item.name,
                    item.description,
                    '',
                    item.modifiers.map(m => `${m.value > 0 ? '+' : ''}${m.value} ${m.stat}`).join('   '),
                    reqLine,
                    penalty,
                    item.flavourText ? `"${item.flavourText}"` : ''
                ].filter(Boolean).join('\n');

                this.logBox.showTooltip(lines);
            };

            card.on('pointerover', showDetail);
            card.on('pointerout', () => this.logBox.clearTooltip());
            nameText.on('pointerover', showDetail);
            nameText.on('pointerout', () => this.logBox.clearTooltip());

            // Click to buy
            card.on('pointerdown', () => {
                if (canAfford) this.handleBuyEquipment(shopItem, item, card);
            });
        }
    }

    private drawRelicColumn(items: ShopItem[], x: number, startY: number) {
        items.forEach((shopItem, index) => {
            const relic = shopItem.relic!;
            const y = startY + (index * 120);
            this.drawRelicCard(shopItem, relic, x, y);
        });
    }

    private drawRelicCard(shopItem: ShopItem, relic: Relic, x: number, y: number) {
        const cardW = 180;
        const cardH = 100;
        const canAfford = this.player.gold >= shopItem.price;
        const isSold = shopItem.sold;

        const card = this.add.rectangle(x, y + cardH / 2, cardW, cardH, 0x0f172a)
            .setStrokeStyle(1, isSold ? 0x1e293b : 0x78350f)
            .setOrigin(0.5)
            .setAlpha(isSold ? 0.4 : 1);

        // Gold accent strip
        this.add.rectangle(x, y + 4, cardW - 2, 4, isSold ? 0x1e293b : 0x78350f)
            .setOrigin(0.5, 0);

        this.add.text(x, y + 18, relic.name, {
            fontFamily: 'Verdana', fontSize: '13px',
            color: isSold ? '#374151' : '#fbbf24', fontStyle: 'bold',
            wordWrap: { width: cardW - 16 }, align: 'center'
        }).setOrigin(0.5);

        // Short description preview
        const shortDesc = relic.description.length > 40
            ? relic.description.substring(0, 37) + '...'
            : relic.description;
        this.add.text(x, y + 48, shortDesc, {
            fontFamily: 'Verdana', fontSize: '10px',
            color: isSold ? '#1e293b' : '#64748b',
            wordWrap: { width: cardW - 16 }, align: 'center'
        }).setOrigin(0.5);

        const priceColor = isSold ? '#1e293b' : canAfford ? '#e2c16b' : '#ef4444';
        const priceLabel = isSold ? 'SOLD' : `🪙 ${shopItem.price}`;
        this.add.text(x, y + 78, priceLabel, {
            fontFamily: 'Verdana', fontSize: '13px',
            color: priceColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        if (!isSold) {
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                this.logBox.showTooltip(
                    `${relic.name}\n\n${relic.description}`
                );
            });
            card.on('pointerout', () => this.logBox.clearTooltip());
            card.on('pointerdown', () => {
                if (canAfford) this.handleBuyRelic(shopItem, relic, card);
            });
        }
    }

    // --- PURCHASE HANDLERS ---

    private handleBuyEquipment(shopItem: ShopItem, item: Equipment, card: Phaser.GameObjects.Rectangle) {
        const store = usePlayerStore.getState();
        const currentItem = store.equipment[item.slot];

        if (!currentItem) {
            // Slot empty — buy and equip immediately
            store.spendGold(shopItem.price);
            store.equipItem(item);
            this.player = usePlayerStore.getState() as PlayerData;
            shopItem.sold = true;
            card.setAlpha(0.4).setStrokeStyle(1, 0x1e293b);
            this.logBox.showTooltip(`Equipped ${item.name}!`);
            this.refreshGoldText();
            this.refreshPriceColors();
        } else {
            // Slot occupied — show swap confirmation
            this.showEquipSwap(shopItem, item, currentItem);
        }
    }

    private handleBuyRelic(shopItem: ShopItem, relic: Relic, card: Phaser.GameObjects.Rectangle) {
        const store = usePlayerStore.getState();
        const hasSpace = store.relics.length < 5;

        if (hasSpace) {
            store.spendGold(shopItem.price);
            store.addRelic(relic);
            this.player = usePlayerStore.getState() as PlayerData;
            shopItem.sold = true;
            card.setAlpha(0.4).setStrokeStyle(1, 0x1e293b);
            this.logBox.showTooltip(`Obtained ${relic.name}!`);
            this.refreshGoldText();
        } else {
            // Relic slots full — show swap picker
            this.showRelicSwap(shopItem, relic);
        }
    }

    // --- SWAP OVERLAYS ---

    private showEquipSwap(shopItem: ShopItem, incoming: Equipment, current: Equipment) {
        const { width, height } = this.scale;
        const panel = new PanelOverlay(this, {
            title: 'SWAP EQUIPMENT?',
            width: 480,
            height: 320
        });

        const cc = panel.contentContainer;

        // Current vs incoming side by side
        this.addSwapColumn(cc, 'CURRENT', current, 0, '#3b82f6');
        this.addSwapColumn(cc, 'NEW', incoming, 240, '#ef4444');

        // VS label
        cc.add(this.add.text(220, 100, 'VS', {
            fontFamily: 'Verdana', fontSize: '18px', color: '#7e87a2', fontStyle: 'italic'
        }).setOrigin(0.5));

        // Buttons
        const keepBtn = this.add.rectangle(120, 230, 160, 40, 0x1e3a5f)
            .setStrokeStyle(1, 0x3b82f6)
            .setInteractive({ useHandCursor: true });
        cc.add([
            keepBtn,
            this.add.text(120, 230, 'KEEP CURRENT', {
                fontFamily: 'Verdana', fontSize: '12px', color: '#3b82f6', fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        ]);
        keepBtn.on('pointerdown', () => panel.close());

        const swapBtn = this.add.rectangle(320, 230, 160, 40, 0x7f1d1d)
            .setStrokeStyle(1, 0xef4444)
            .setInteractive({ useHandCursor: true });
        cc.add([
            swapBtn,
            this.add.text(320, 230, 'TAKE NEW', {
                fontFamily: 'Verdana', fontSize: '12px', color: '#ef4444', fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        ]);
        swapBtn.on('pointerdown', () => {
            const store = usePlayerStore.getState();
            store.spendGold(shopItem.price);
            store.equipItem(incoming);
            this.player = usePlayerStore.getState() as PlayerData;
            shopItem.sold = true;
            this.refreshGoldText();
            this.refreshPriceColors();
            this.logBox.showTooltip(`Swapped to ${incoming.name}!`);
            panel.close();
        });
    }

    private showRelicSwap(shopItem: ShopItem, incoming: Relic) {
        const panel = new PanelOverlay(this, {
            title: 'RELIC SLOTS FULL — DROP ONE?',
            width: 480,
            height: 360
        });

        const cc = panel.contentContainer;
        cc.add(this.add.text(0, 0, `Incoming: ${incoming.name}`, {
            fontFamily: 'Verdana', fontSize: '13px',
            color: '#fbbf24', fontStyle: 'bold'
        }));
        cc.add(this.add.text(0, 20, incoming.description, {
            fontFamily: 'Verdana', fontSize: '11px', color: '#64748b',
            wordWrap: { width: 430 }
        }));
        cc.add(this.add.text(0, 56, 'Choose a relic to drop:', {
            fontFamily: 'Verdana', fontSize: '12px', color: '#94a3b8'
        }));

        const store = usePlayerStore.getState();

        store.relics.forEach((relic, index) => {
            const y = 80 + (index * 46);
            const rowBg = this.add.rectangle(220, y + 16, 430, 38, 0x1a2035)
                .setStrokeStyle(1, 0x334155)
                .setInteractive({ useHandCursor: true });

            const nameT = this.add.text(10, y + 8, relic.name, {
                fontFamily: 'Verdana', fontSize: '12px',
                color: '#fbbf24', fontStyle: 'bold'
            });
            const descT = this.add.text(10, y + 24, relic.description.substring(0, 55), {
                fontFamily: 'Verdana', fontSize: '10px', color: '#64748b'
            });
            const dropT = this.add.text(420, y + 16, 'DROP', {
                fontFamily: 'Verdana', fontSize: '11px', color: '#ef4444', fontStyle: 'bold'
            }).setOrigin(1, 0.5);

            cc.add([rowBg, nameT, descT, dropT]);

            rowBg.on('pointerover', () => rowBg.setStrokeStyle(1, 0xef4444));
            rowBg.on('pointerout', () => rowBg.setStrokeStyle(1, 0x334155));
            rowBg.on('pointerdown', () => {
                store.spendGold(shopItem.price);
                store.swapRelic(relic.id, incoming);
                this.player = usePlayerStore.getState() as PlayerData;
                shopItem.sold = true;
                this.refreshGoldText();
                this.logBox.showTooltip(`Dropped ${relic.name}, obtained ${incoming.name}!`);
                panel.close();
            });
        });

        // Cancel
        const cancelBtn = this.add.rectangle(220, 320, 180, 38, 0x1e293b)
            .setStrokeStyle(1, 0x334155)
            .setInteractive({ useHandCursor: true });
        cc.add([
            cancelBtn,
            this.add.text(220, 320, 'CANCEL', {
                fontFamily: 'Verdana', fontSize: '12px', color: '#64748b'
            }).setOrigin(0.5)
        ]);
        cancelBtn.on('pointerdown', () => panel.close());
    }

    // --- UTILITY ---

    private addSwapColumn(
        container: Phaser.GameObjects.Container,
        tag: string,
        item: Equipment,
        x: number,
        color: string
    ) {
        container.add([
            this.add.text(x + 100, 10, tag, {
                fontFamily: 'Verdana', fontSize: '11px',
                color, fontStyle: 'bold', letterSpacing: 2
            }).setOrigin(0.5),
            this.add.text(x + 100, 36, item.name, {
                fontFamily: 'Verdana', fontSize: '14px',
                color: '#ffffff', fontStyle: 'bold',
                wordWrap: { width: 190 }, align: 'center'
            }).setOrigin(0.5),
            this.add.text(x + 100, 68, item.description, {
                fontFamily: 'Verdana', fontSize: '11px',
                color: '#64748b', wordWrap: { width: 190 }, align: 'center'
            }).setOrigin(0.5),
            this.add.text(x + 100, 110,
                item.modifiers.map(m => `${m.value > 0 ? '+' : ''}${m.value} ${m.stat}`).join('\n'), {
                fontFamily: 'Verdana', fontSize: '12px',
                color: '#94a3b8', align: 'center'
            }).setOrigin(0.5)
        ]);
    }

    private refreshGoldText() {
        const gold = usePlayerStore.getState().gold;
        this.goldText.setText(`🪙 ${gold} gold`);
    }

    // Refresh price label colors after a purchase changes player gold
    private refreshPriceColors() {
        // Simplest approach: restart the scene in-place to redraw
        // Alternative: track all price text refs and update colors
        // For now redraw is clean and instant
        this.scene.restart();
    }
}