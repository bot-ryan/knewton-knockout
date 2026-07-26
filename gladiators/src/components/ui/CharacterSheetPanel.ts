// src/components/ui/CharacterSheetPanel.ts
import Phaser from 'phaser';
import { PanelOverlay } from './PanelOverlay';
import { type PlayerData } from '../../data/PlayerData';

export class CharacterSheetPanel {

    /**
     * Creates the round character sheet button and places it on screen.
     * Call this once in any scene's create() method.
     * 
     * @param scene        — the Phaser scene
     * @param player       — the player data to display
     * @param x            — button center X (defaults to bottom-right)
     * @param y            — button center Y (defaults to bottom-right)
     * @param uiContainer  — pass this in CombatScene for dual-camera support
     */
    static createButton(
        scene: Phaser.Scene,
        player: PlayerData,
        x?: number,
        y?: number,
        uiContainer?: Phaser.GameObjects.Container
    ) {
        const btnX = x ?? scene.scale.width - 50;
        const btnY = y ?? scene.scale.height - 50;
        const radius = 28;

        const btnContainer = scene.add.container(btnX, btnY);

        // Circle background
        const btnCircle = scene.add.graphics();
        const drawCircle = (hovered: boolean) => {
            btnCircle.clear();
            btnCircle.fillStyle(hovered ? 0x2a4a7f : 0x1e3a5f, 1);
            btnCircle.fillCircle(0, 0, radius);
            btnCircle.lineStyle(2, hovered ? 0x60a5fa : 0x3b82f6, 1);
            btnCircle.strokeCircle(0, 0, radius);
        };
        drawCircle(false);

        // Icon
        const btnIcon = scene.add.text(0, 0, '🧍', { fontSize: '20px' }).setOrigin(0.5);

        // Transparent hit area
        const btnHit = scene.add.graphics();
        btnHit.fillStyle(0xffffff, 0.001);
        btnHit.fillCircle(0, 0, radius);
        btnHit.setInteractive(
            new Phaser.Geom.Circle(0, 0, radius),
            Phaser.Geom.Circle.Contains
        );

        btnHit.on('pointerover', () => drawCircle(true));
        btnHit.on('pointerout', () => drawCircle(false));
        btnHit.on('pointerdown', () => CharacterSheetPanel.open(scene, player, uiContainer));

        btnContainer.add([btnCircle, btnIcon, btnHit]);
        btnContainer.setScrollFactor(0).setDepth(10);

        // If in CombatScene, register with uiContainer for correct camera
        if (uiContainer) {
            uiContainer.add(btnContainer);
        }

        return btnContainer; // returned in case the caller needs to reposition or destroy it
    }

    /**
     * Opens the character sheet panel directly without a button.
     * Useful if you want to trigger it programmatically.
     */
    static open(
        scene: Phaser.Scene,
        player: PlayerData,
        uiContainer?: Phaser.GameObjects.Container
    ) {
        const panel = new PanelOverlay(scene, {
            title: 'CHARACTER SHEET',
            width: 500,
            height: 460
        });

        if (uiContainer) {
            uiContainer.add(panel);
        }

        const cc = panel.contentContainer;
        const colLeft = 0;
        const colRight = 240;
        let y = 0;

        // --- VITALS ---
        CharacterSheetPanel.addSectionHeader(scene, cc, 'VITALS', colLeft, y);
        y += 28;

        const vitals = [
            { label: '❤️  HP', value: `${player.secondaryStats.hp.current} / ${player.secondaryStats.hp.max}` },
            { label: '⚡ Stamina', value: `${player.secondaryStats.stamina.current} / ${player.secondaryStats.stamina.max}` },
            { label: '🪙 Gold', value: `${player.gold}` }
        ];

        vitals.forEach(row => {
            CharacterSheetPanel.addStatRow(scene, cc, row.label, row.value, colLeft, y);
            y += 24;
        });

        y += 16;

        // --- PRIMARY STATS (left) + EQUIPMENT (right) ---
        CharacterSheetPanel.addSectionHeader(scene, cc, 'PRIMARY STATS', colLeft, y);
        CharacterSheetPanel.addSectionHeader(scene, cc, 'EQUIPMENT', colRight, y);
        y += 28;

        const primaryStats = [
            { label: 'Strength', value: player.stats.strength },
            { label: 'Dexterity', value: player.stats.dexterity },
            { label: 'Precision', value: player.stats.precision },
            { label: 'Guard', value: player.stats.guard },
            { label: 'Vitality', value: player.stats.vitality },
            { label: 'Arcane', value: player.stats.arcane }
        ];

        primaryStats.forEach(stat => {
            CharacterSheetPanel.addStatRow(scene, cc, stat.label, String(stat.value), colLeft, y);
            y += 24;
        });

        // Equipment column — realigns to start of stats block
        let equipY = y - (primaryStats.length * 24);
        const equipment = player.equipment ?? { weapon: null, shield: null, accessory: null };

        const slots = [
            { label: '⚔️  Weapon', item: equipment.weapon },
            { label: '🛡️  Shield', item: equipment.shield },
            { label: '💍 Accessory', item: equipment.accessory }
        ];

        slots.forEach(slot => {
            const itemName = slot.item ? slot.item.name : 'Empty';
            const itemColor = slot.item ? '#ffffff' : '#4b5563';
            CharacterSheetPanel.addStatRow(scene, cc, slot.label, itemName, colRight, equipY, itemColor);
            equipY += 24;
        });

        // 🔥 NEW: Divider line
        y += 16;
        const divider = scene.add.graphics();
        divider.lineStyle(1, 0x1e293b, 1);
        divider.moveTo(0, y);
        divider.lineTo(460, y); // panel width - padding
        divider.strokePath();
        cc.add(divider);
        y += 16;

        // 🔥 NEW: RELICS section
        CharacterSheetPanel.addSectionHeader(scene, cc, 'RELICS', colLeft, y);

        // Relic count badge e.g. "2 / 5"
        const relics = player.relics ?? [];
        const relicCountText = scene.add.text(460, y, `${relics.length} / 5`, {
            fontFamily: 'Verdana',
            fontSize: '11px',
            color: '#64748b',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        cc.add(relicCountText);

        y += 24;

        const MAX_RELICS = 5;

        if (relics.length === 0) {
            // Empty state message
            const emptyText = scene.add.text(0, y, 'No relics collected yet.', {
                fontFamily: 'Verdana',
                fontSize: '13px',
                color: '#4b5563',
                fontStyle: 'italic'
            });
            cc.add(emptyText);
        } else {
            // Show each relic as a row
            relics.forEach((relic, index) => {
                CharacterSheetPanel.addRelicRow(scene, cc, relic, index, y);
                y += 28;
            });

            // Fill remaining empty slots with dashes so player can see capacity
            for (let i = relics.length; i < MAX_RELICS; i++) {
                const emptySlot = scene.add.text(0, y, `— Empty slot`, {
                    fontFamily: 'Verdana',
                    fontSize: '12px',
                    color: '#1e293b'
                });
                cc.add(emptySlot);
                y += 28;
            }
        }
    }

    // --- PRIVATE HELPERS ---

    // 🔥 NEW: Relic row helper
    private static addRelicRow(
        scene: Phaser.Scene,
        container: Phaser.GameObjects.Container,
        relic: any,
        index: number,
        y: number
    ) {
        // Small index number
        const indexText = scene.add.text(0, y, `${index + 1}.`, {
            fontFamily: 'Verdana',
            fontSize: '12px',
            color: '#64748b'
        });

        // Relic name
        const nameText = scene.add.text(20, y, relic.name, {
            fontFamily: 'Verdana',
            fontSize: '13px',
            color: '#fbbf24', // gold colour — relics feel special
            fontStyle: 'bold'
        });

        // Relic description — truncated if too long
        const desc = relic.description.length > 45
            ? relic.description.substring(0, 42) + '...'
            : relic.description;

        const descText = scene.add.text(20, y + 14, desc, {
            fontFamily: 'Verdana',
            fontSize: '11px',
            color: '#94a3b8'
        });

        container.add([indexText, nameText, descText]);
    }

    private static addSectionHeader(
            scene: Phaser.Scene,
            container: Phaser.GameObjects.Container,
            label: string,
            x: number,
            y: number
        ) {
        container.add(
            scene.add.text(x, y, label, {
                fontFamily: 'Verdana',
                fontSize: '11px',
                color: '#64748b',
                fontStyle: 'bold',
                letterSpacing: 2
            })
        );
    }

    private static addStatRow(
        scene: Phaser.Scene,
        container: Phaser.GameObjects.Container,
        label: string,
        value: string,
        x: number,
        y: number,
        valueColor: string = '#e2e8f0'
    ) {
        container.add([
            scene.add.text(x, y, label, {
                fontFamily: 'Verdana',
                fontSize: '13px',
                color: '#94a3b8'
            }),
            scene.add.text(x + 200, y, value, {
                fontFamily: 'Verdana',
                fontSize: '13px',
                color: valueColor,
                fontStyle: 'bold'
            }).setOrigin(1, 0)
        ]);
    }
}