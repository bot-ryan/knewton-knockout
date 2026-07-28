// src/components/ui/CharacterSheetPanel.ts
import Phaser from 'phaser';
import { PanelOverlay } from './PanelOverlay';
import { type PlayerData } from '../../data/PlayerData';
import { StatCalculator } from '../../utils/StatCalculator';


export class CharacterSheetPanel {

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

        const btnCircle = scene.add.graphics();
        const drawCircle = (hovered: boolean) => {
            btnCircle.clear();
            btnCircle.fillStyle(hovered ? 0x2a4a7f : 0x1e3a5f, 1);
            btnCircle.fillCircle(0, 0, radius);
            btnCircle.lineStyle(2, hovered ? 0x60a5fa : 0x3b82f6, 1);
            btnCircle.strokeCircle(0, 0, radius);
        };
        drawCircle(false);

        const btnIcon = scene.add.text(0, 0, '🧍', { fontSize: '20px' }).setOrigin(0.5);

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

        if (uiContainer) uiContainer.add(btnContainer);

        return btnContainer;
    }

    static open(
        scene: Phaser.Scene,
        player: PlayerData,
        uiContainer?: Phaser.GameObjects.Container
    ) {
        const panel = new PanelOverlay(scene, {
            title: 'CHARACTER SHEET',
            width: 500,
            height: 480
        });

        if (uiContainer) uiContainer.add(panel);

        const cc = panel.contentContainer;
        const colLeft = 0;
        const colRight = 240;
        const infoWidth = 200;
        const infoHeight = 110;
        let y = 0;

        // --- INFO BOX (top right — the empty area) ---
        const infoBg = scene.add.rectangle(colRight, 0, infoWidth, infoHeight, 0x0a1128)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x1e293b);

        const infoText = scene.add.text(colRight + 10, 8, 'Hover over any stat\nto see details.', {
            fontFamily: 'Verdana',
            fontSize: '11px',
            color: '#4b5563',
            wordWrap: { width: infoWidth - 20 },
            lineSpacing: 4
        });

        cc.add([infoBg, infoText]);

        // Helper — updates the info box text
        const showInfo = (text: string) => infoText.setText(text).setColor('#94a3b8');
        const clearInfo = () => infoText.setText('Hover over any stat\nto see details.').setColor('#4b5563');

        // --- VITALS ---
        CharacterSheetPanel.addSectionHeader(scene, cc, 'VITALS', colLeft, y);
        y += 28;

        const vitalDescriptions: Record<string, string> = {
            '❤️  HP': 'Your health points.\nReaching 0 means defeat.\nRest between fights to recover.',
            '⚡ Stamina': 'Powers your actions each turn.\nRunning out forces a rest.\nRecovers 20 per REST action.',
            '🪙 Gold': 'Earned by defeating enemies.\nSpend at shop nodes on\nthe map to buy upgrades.',
        };

        const vitals = [
            { label: '❤️  HP', value: `${player.secondaryStats.hp.current} / ${player.secondaryStats.hp.max}` },
            { label: '⚡ Stamina', value: `${player.secondaryStats.stamina.current} / ${player.secondaryStats.stamina.max}` },
            { label: '🪙 Gold', value: `${player.gold}` },
        ];

        vitals.forEach(row => {
            CharacterSheetPanel.addStatRow(
                scene, cc, row.label, row.value, colLeft, y,
                '#e2e8f0',
                () => showInfo(vitalDescriptions[row.label] ?? ''),
                clearInfo
            );
            y += 24;
        });

        // Attack row — shows overall range, info box shows breakdown
        CharacterSheetPanel.addAttackRow(scene, cc, player, colLeft, y, showInfo, clearInfo);
        y += 24;

        y += 16;

        // --- PRIMARY STATS (left) + EQUIPMENT (right, below info box) ---
        const equipStartY = infoHeight + 16; // equipment starts below the info box
        CharacterSheetPanel.addSectionHeader(scene, cc, 'PRIMARY STATS', colLeft, y);
        CharacterSheetPanel.addSectionHeader(scene, cc, 'EQUIPMENT', colRight, equipStartY);
        y += 28;

        const statDescriptions: Record<string, string> = {
            'Strength': 'Increases melee weapon\ndamage and lets you equip\nheavy weapons.',
            'Dexterity': 'Increases movement range,\ncharge range, and dagger\nor bow damage.',
            'Precision': 'Increases hit chance and\ncritical strike chance.',
            'Guard': 'Increases the chance to\ndodge incoming attacks.',
            'Vitality': 'Increases max HP\nand max stamina.',
            'Arcane': 'Increases max mana and\nspell power for future\nmagic abilities.',
        };

        const primaryStats = [
            { label: 'Strength', value: player.stats.strength },
            { label: 'Dexterity', value: player.stats.dexterity },
            { label: 'Precision', value: player.stats.precision },
            { label: 'Guard', value: player.stats.guard },
            { label: 'Vitality', value: player.stats.vitality },
            { label: 'Arcane', value: player.stats.arcane }
        ];

        primaryStats.forEach(stat => {
            CharacterSheetPanel.addStatRow(
                scene, cc, stat.label, String(stat.value), colLeft, y,
                '#e2e8f0',
                () => showInfo(statDescriptions[stat.label] ?? ''),
                clearInfo
            );
            y += 24;
        });

        // Equipment slots (right column, starts below info box)
        let equipY = equipStartY + 28;
        const equipment = player.equipment ?? { weapon: null, shield: null, accessory: null };

        const slots = [
            {
                label: '⚔️  Weapon',
                item: equipment.weapon,
                emptyInfo: 'No weapon equipped.\nBare fists deal 2–4 base\ndamage scaled by Strength.',
            },
            {
                label: '🛡️  Shield',
                item: equipment.shield,
                emptyInfo: 'No shield equipped.\nShields improve Guard and\ncan reduce incoming damage.',
            },
            {
                label: '💍 Accessory',
                item: equipment.accessory,
                emptyInfo: 'No accessory equipped.\nAccessories provide unique\nbonuses with no requirements.',
            },
        ];

        // Replace the slots.forEach block with this:
        slots.forEach(slot => {
            const item = slot.item;
            const itemName = item ? item.name : 'Empty';

            // 🔥 NEW: check requirement — show red if not met
            const meetsReq = item ? StatCalculator.meetsRequirement(player, item) : true;
            const itemColor = !item
                ? '#4b5563'              // empty — gray
                : meetsReq
                    ? '#ffffff'          // equipped and requirement met — white
                    : '#ef4444';         // equipped but requirement NOT met — red warning

            // Build hover info
            let hoverInfo: string;
            if (!item) {
                hoverInfo = slot.emptyInfo;
            } else {
                const modifierLines = item.modifiers.map(m =>
                    `${m.value > 0 ? '+' : ''}${m.value} ${m.stat}`
                );

                // 🔥 NEW: requirement line changes colour based on whether it's met
                const reqLine = item.requirement
                    ? meetsReq
                        ? `✓ Requires ${item.requirement.stat} ${item.requirement.value}`
                        : `✗ Requires ${item.requirement.stat} ${item.requirement.value} (NOT MET)`
                    : 'No requirement';

                hoverInfo = [
                    item.name,
                    item.description,
                    '',
                    ...modifierLines,
                    '',
                    reqLine,
                    !meetsReq
                        ? `Penalty: +${StatCalculator.getRequirementPenalty(player, item)} stamina per attack`
                        : ''
                ].filter(Boolean).join('\n');
            }

            CharacterSheetPanel.addStatRow(
                scene, cc, slot.label, itemName, colRight, equipY,
                itemColor,
                () => showInfo(hoverInfo),
                clearInfo
            );
            equipY += 24;
        });

        // --- DIVIDER ---
        const dividerY = Math.max(y, equipY) + 12;
        const divider = scene.add.graphics();
        divider.lineStyle(1, 0x1e293b, 1);
        divider.moveTo(0, dividerY);
        divider.lineTo(460, dividerY);
        divider.strokePath();
        cc.add(divider);

        // --- RELICS ---
        let relicY = dividerY + 16;
        CharacterSheetPanel.addSectionHeader(scene, cc, 'RELICS', colLeft, relicY);

        const relics = player.relics ?? [];
        const relicCountText = scene.add.text(460, relicY, `${relics.length} / 5`, {
            fontFamily: 'Verdana', fontSize: '11px', color: '#64748b', fontStyle: 'bold'
        }).setOrigin(1, 0);
        cc.add(relicCountText);

        relicY += 24;

        if (relics.length === 0) {
            const emptyText = scene.add.text(0, relicY, 'No relics collected yet.', {
                fontFamily: 'Verdana', fontSize: '13px', color: '#4b5563', fontStyle: 'italic'
            }).setInteractive({ useHandCursor: true });
            emptyText.on('pointerover', () => showInfo('Relics are passive items\ncollected during your run.\nYou can hold up to 5.'));
            emptyText.on('pointerout', () => clearInfo());
            cc.add(emptyText);
        } else {
            relics.forEach((relic, index) => {
                CharacterSheetPanel.addRelicRow(scene, cc, relic, index, relicY, showInfo, clearInfo);
                relicY += 28;
            });

            for (let i = relics.length; i < 5; i++) {
                const emptySlot = scene.add.text(0, relicY, `— Empty slot`, {
                    fontFamily: 'Verdana', fontSize: '12px', color: '#1e293b'
                });
                cc.add(emptySlot);
                relicY += 28;
            }
        }
    }

    // --- PRIVATE HELPERS ---

    private static addSectionHeader(
        scene: Phaser.Scene,
        container: Phaser.GameObjects.Container,
        label: string,
        x: number,
        y: number
    ) {
        container.add(
            scene.add.text(x, y, label, {
                fontFamily: 'Verdana', fontSize: '11px',
                color: '#64748b', fontStyle: 'bold', letterSpacing: 2
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
        valueColor: string = '#e2e8f0',
        onHover?: () => void,
        onOut?: () => void
    ) {
        const labelText = scene.add.text(x, y, label, {
            fontFamily: 'Verdana', fontSize: '13px', color: '#94a3b8'
        });

        const valueText = scene.add.text(x + 200, y, value, {
            fontFamily: 'Verdana', fontSize: '13px', color: valueColor, fontStyle: 'bold'
        }).setOrigin(1, 0);

        if (onHover) {
            labelText.setInteractive({ useHandCursor: true });
            labelText.on('pointerover', () => { labelText.setColor('#ffffff'); onHover(); });
            labelText.on('pointerout', () => { labelText.setColor('#94a3b8'); onOut?.(); });
        }

        container.add([labelText, valueText]);
    }

    private static addAttackRow(
        scene: Phaser.Scene,
        container: Phaser.GameObjects.Container,
        player: PlayerData,
        x: number,
        y: number,
        showInfo: (text: string) => void,
        clearInfo: () => void
    ) {
        const ranges = StatCalculator.getAllAttackRanges(player);
        const atk = StatCalculator.getAttackValue(player);

        const weapon = player.equipment?.weapon;
        const scalingRaw = weapon?.scalingStat;
        const scalingLabel = !scalingRaw
            ? 'Strength'
            : Array.isArray(scalingRaw)
                ? scalingRaw.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' or ')
                : scalingRaw.charAt(0).toUpperCase() + scalingRaw.slice(1);

        const hoverInfo = [
            `Scales with: ${scalingLabel}`,
            '',
            `⚡ Quick   ${ranges.quick.min}–${ranges.quick.max}`,
            `⚔️  Normal  ${ranges.normal.min}–${ranges.normal.max}`,
            `💥 Power   ${ranges.power.min}–${ranges.power.max}`,
        ].join('\n');

        const labelText = scene.add.text(x, y, '⚔️  Attack', {
            fontFamily: 'Verdana', fontSize: '13px', color: '#94a3b8'
        }).setInteractive({ useHandCursor: true });

        const valueText = scene.add.text(x + 200, y, `${atk.min} – ${atk.max}`, {
            fontFamily: 'Verdana', fontSize: '13px', color: '#e2e8f0', fontStyle: 'bold'
        }).setOrigin(1, 0);

        labelText.on('pointerover', () => { labelText.setColor('#ffffff'); showInfo(hoverInfo); });
        labelText.on('pointerout', () => { labelText.setColor('#94a3b8'); clearInfo(); });

        container.add([labelText, valueText]);
    }

    private static addRelicRow(
        scene: Phaser.Scene,
        container: Phaser.GameObjects.Container,
        relic: any,
        index: number,
        y: number,
        showInfo: (text: string) => void,
        clearInfo: () => void
    ) {
        const indexText = scene.add.text(0, y, `${index + 1}.`, {
            fontFamily: 'Verdana', fontSize: '12px', color: '#64748b'
        });

        const nameText = scene.add.text(20, y, relic.name, {
            fontFamily: 'Verdana', fontSize: '13px', color: '#fbbf24', fontStyle: 'bold'
        }).setInteractive({ useHandCursor: true });

        const descText = scene.add.text(20, y + 14, relic.description.length > 45
            ? relic.description.substring(0, 42) + '...'
            : relic.description, {
            fontFamily: 'Verdana', fontSize: '11px', color: '#94a3b8'
        });

        nameText.on('pointerover', () => {
            nameText.setColor('#fde68a');
            showInfo(`${relic.name}\n\n${relic.description}`);
        });
        nameText.on('pointerout', () => {
            nameText.setColor('#fbbf24');
            clearInfo();
        });

        container.add([indexText, nameText, descText]);
    }
}