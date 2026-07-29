// src/utils/StatCalculator.ts
import type { PlayerData } from '../data/PlayerData';
import type { Equipment, ScalingStat } from '../data/Equipment/EquipmentTypes';
import { ATTACK_MULTIPLIERS, BARE_FIST_BASE } from './CombatEngine';
import {GameConfig} from '../data/GameConfig';

export class StatCalculator {

    // 🔥 UPDATED: added safety guard for missing equipment
    static getEffectiveStats(player: PlayerData): Record<string, number> {
        const effective: Record<string, number> = { ...player.stats };

        const equip = player.equipment;
        if (!equip) return effective; // safety — old data without equipment field

        const allItems = [equip.weapon, equip.shield, equip.accessory].filter(Boolean);
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

    static getAllAttackRanges(player: PlayerData): {
        quick: { min: number; max: number };
        normal: { min: number; max: number };
        power: { min: number; max: number };
    } {
        const weapon = player.equipment?.weapon;
        const effectiveStats = StatCalculator.getEffectiveStats(player);
        const base = weapon?.baseDamage ?? BARE_FIST_BASE;
        const scalingValue = StatCalculator.resolveScalingStat(weapon?.scalingStat, effectiveStats);
        const statBonus = Math.floor(scalingValue * 0.5);

        const calc = (multiplier: number) => ({
            min: Math.max(1, Math.floor(base.min * multiplier) + statBonus),
            max: Math.max(1, Math.floor(base.max * multiplier) + statBonus)
        });

        return {
            quick: calc(ATTACK_MULTIPLIERS['QUICK']),
            normal: calc(ATTACK_MULTIPLIERS['NORMAL']),
            power: calc(ATTACK_MULTIPLIERS['POWER'])
        };
    }

    static getEffectiveMaxHp(player: PlayerData): number {
        const effectiveStats = StatCalculator.getEffectiveStats(player);
        const effectiveVitality = effectiveStats['vitality'] ?? 0;
        return GameConfig.SCALING.HP_BASE + (effectiveVitality * GameConfig.SCALING.HP_PER_VITALITY);
    }

    // Computes effective max stamina based on vitality including equipment bonuses
    static getEffectiveMaxStamina(player: PlayerData): number {
        const effectiveStats = StatCalculator.getEffectiveStats(player);
        const effectiveVitality = effectiveStats['vitality'] ?? 0;
        return GameConfig.SCALING.STAMINA_BASE + (effectiveVitality * GameConfig.SCALING.STAMINA_PER_VITALITY);
    }

    static getAttackValue(player: PlayerData): { min: number; max: number } {
        const ranges = StatCalculator.getAllAttackRanges(player);
        return {
            min: ranges.quick.min,
            max: ranges.power.max
        };
    }

    // 🔥 NEW: checks base stats (not effective) — requirement is about raw ability
    static meetsRequirement(player: PlayerData, item: Equipment): boolean {
        if (!item.requirement) return true;
        return (player.stats[item.requirement.stat as keyof typeof player.stats] ?? 0)
            >= item.requirement.value;
    }

    // 🔥 NEW: how many points short — 0 means requirement met
    static getRequirementShortfall(player: PlayerData, item: Equipment): number {
        if (!item.requirement) return 0;
        const playerStat = player.stats[item.requirement.stat as keyof typeof player.stats] ?? 0;
        return Math.max(0, item.requirement.value - playerStat);
    }

    // 🔥 NEW: extra stamina cost for using a weapon you don't meet the requirement for
    // 2 extra stamina per missing stat point — noticeable but not instantly crippling
    static getRequirementPenalty(player: PlayerData, item: Equipment): number {
        return StatCalculator.getRequirementShortfall(player, item) * 2;
    }
}