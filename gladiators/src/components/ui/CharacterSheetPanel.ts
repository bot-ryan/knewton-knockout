// src/components/ui/CharacterSheetPanel.ts
import Phaser from 'phaser';
import { PanelOverlay } from './PanelOverlay';
import { type PlayerData } from '../../data/PlayerData';

export class CharacterSheetPanel {

    static open(scene: Phaser.Scene, player: PlayerData, uiContainer?: Phaser.GameObjects.Container) {
        const panel = new PanelOverlay(scene, {
            title: 'CHARACTER SHEET',
            width: 500,
            height: 460
        });

        // If a uiContainer is passed (CombatScene), add to it so the correct camera picks it up
        // If not (OpenMap, ShopScene), it's already registered via scene.add.existing in PanelOverlay
        if (uiContainer) {
            uiContainer.add(panel);
        }

        const cc = panel.contentContainer;
        const colLeft  = 0;
        const colRight = 240;
        let y = 0;

        // --- VITALS ---
        CharacterSheetPanel.addSectionHeader(scene, cc, 'VITALS', colLeft, y);
        y += 28;

        const vitals = [
            { label: '❤️  HP',      value: `${player.secondaryStats.hp.current} / ${player.secondaryStats.hp.max}` },
            { label: '⚡ Stamina', value: `${player.secondaryStats.stamina.current} / ${player.secondaryStats.stamina.max}` },
            { label: '🪙 Gold',    value: `${player.gold}` }
        ];

        vitals.forEach(row => {
            CharacterSheetPanel.addStatRow(scene, cc, row.label, row.value, colLeft, y);
            y += 24;
        });

        y += 16;

        // --- PRIMARY STATS (left) + EQUIPMENT (right) ---
        CharacterSheetPanel.addSectionHeader(scene, cc, 'PRIMARY STATS', colLeft,  y);
        CharacterSheetPanel.addSectionHeader(scene, cc, 'EQUIPMENT',     colRight, y);
        y += 28;

        const primaryStats = [
            { label: 'Strength',  value: player.stats.strength },
            { label: 'Dexterity', value: player.stats.dexterity },
            { label: 'Precision', value: player.stats.precision },
            { label: 'Guard',     value: player.stats.guard },
            { label: 'Vitality',  value: player.stats.vitality },
            { label: 'Arcane',    value: player.stats.arcane }
        ];

        primaryStats.forEach(stat => {
            CharacterSheetPanel.addStatRow(scene, cc, stat.label, String(stat.value), colLeft, y);
            y += 24;
        });

        // Equipment column — starts at same Y as primary stats
        let equipY = y - (primaryStats.length * 24);
        const equipment = player.equipment ?? { weapon: null, shield: null, accessory: null };

        const slots = [
            { label: '⚔️  Weapon',    item: equipment.weapon },
            { label: '🛡️  Shield',    item: equipment.shield },
            { label: '💍 Accessory', item: equipment.accessory }
        ];

        slots.forEach(slot => {
            const itemName  = slot.item ? slot.item.name : 'Empty';
            const itemColor = slot.item ? '#ffffff' : '#4b5563';
            CharacterSheetPanel.addStatRow(scene, cc, slot.label, itemName, colRight, equipY, itemColor);
            equipY += 24;
        });
    }

    // --- PRIVATE HELPERS ---

    private static addSectionHeader(
        scene: Phaser.Scene,
        container: Phaser.GameObjects.Container,
        label: string,
        x: number,
        y: number
    ) {
        const header = scene.add.text(x, y, label, {
            fontFamily: 'Verdana',
            fontSize:   '11px',
            color:      '#64748b',
            fontStyle:  'bold',
            letterSpacing: 2
        });
        container.add(header);
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
        const labelText = scene.add.text(x, y, label, {
            fontFamily: 'Verdana',
            fontSize:   '13px',
            color:      '#94a3b8'
        });

        const valueText = scene.add.text(x + 200, y, value, {
            fontFamily: 'Verdana',
            fontSize:   '13px',
            color:      valueColor,
            fontStyle:  'bold'
        }).setOrigin(1, 0);

        container.add([labelText, valueText]);
    }
}