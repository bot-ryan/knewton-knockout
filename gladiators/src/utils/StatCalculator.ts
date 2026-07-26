// src/utils/StatCalculator.ts
import type { PlayerData } from '../data/PlayerData';
import type { ScalingStat } from '../data/Equipment/EquipmentTypes';

export class StatCalculator {

    // Returns base stats + all equipment modifier bonuses combined
    static getEffectiveStats(player: PlayerData): Record<string, number> {
        const effective: Record<string, number> = { ...player.stats };

        const equip = player.equipment;
        const allItems = [equip?.weapon, equip?.shield, equip?.accessory].filter(Boolean);

        allItems.forEach(item => {
            item!.modifiers.forEach(mod => {
                if (effective[mod.stat] !== undefined) {
                    effective[mod.stat] += mod.value;
                }
            });
        });

        return effective;
    }

    // Resolves scalingStat — single stat or picks highest from array
    static resolveScalingStat(
        scalingStat: ScalingStat | undefined,
        effectiveStats: Record<string, number>
    ): number {
        if (!scalingStat) return effectiveStats['strength'] ?? 0;

        if (Array.isArray(scalingStat)) {
            return Math.max(...scalingStat.map(s => effectiveStats[s] ?? 0));
        }

        return effectiveStats[scalingStat] ?? 0;
    }

    // Computes the attack range shown in character sheet
    static getAttackValue(player: PlayerData): { min: number; max: number } {
        const weapon = player.equipment?.weapon;
        const effectiveStats = StatCalculator.getEffectiveStats(player);

        if (!weapon) {
            // Bare fists — strength only, low base
            const bonus = Math.floor((effectiveStats['strength'] ?? 0) * 0.3);
            return { min: 1 + bonus, max: 3 + bonus };
        }

        const scalingValue = StatCalculator.resolveScalingStat(
            weapon.scalingStat,
            effectiveStats
        );
        const bonus = Math.floor(scalingValue * 0.3);

        return { min: 5 + bonus, max: 5 + bonus + 2 };
    }
}