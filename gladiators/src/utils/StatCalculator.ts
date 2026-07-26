// src/utils/StatCalculator.ts
import type { PlayerData } from '../data/PlayerData';
import type { ScalingStat } from '../data/Equipment/EquipmentTypes';
import { ATTACK_MULTIPLIERS, BARE_FIST_BASE } from './CombatEngine';

export class StatCalculator {

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

    // 🔥 CHANGED: uses same constants as CombatEngine for NORMAL attack preview
    static getAttackValue(player: PlayerData): { min: number; max: number } {
        const weapon = player.equipment?.weapon;
        const effectiveStats = StatCalculator.getEffectiveStats(player);

        const base = weapon?.baseDamage ?? BARE_FIST_BASE;
        const scalingValue = StatCalculator.resolveScalingStat(
            weapon?.scalingStat,
            effectiveStats
        );
        const statBonus = Math.floor(scalingValue * 0.5);

        // Show NORMAL attack range in UI (multiplier 1.0 so base is unchanged)
        return {
            min: Math.max(1, Math.floor(base.min  * ATTACK_MULTIPLIERS['NORMAL']) + statBonus),
            max: Math.max(1, Math.floor(base.max * ATTACK_MULTIPLIERS['NORMAL']) + statBonus)
        };
    }
}