// src/utils/CombatEngine.ts

export type AttackType = 'QUICK' | 'NORMAL' | 'POWER';

// 🔥 NEW — exported so StatCalculator can use the same values
export const ATTACK_MULTIPLIERS: Record<AttackType, number> = {
    QUICK:  0.65,
    NORMAL: 1.0,
    POWER:  1.5
};

// 🔥 NEW — bare fist base when no weapon equipped
export const BARE_FIST_BASE = { min: 2, max: 4 };

export class CombatEngine {

    static calculateHit(attackerPrec: number, defenderGuard: number, type: AttackType): boolean {
        return Math.random() * 100 <= CombatEngine.getHitChance(attackerPrec, defenderGuard, type);
    }

    static getHitChance(attackerPrec: number, defenderGuard: number, type: AttackType): number {
        const modifiers: Record<AttackType, number> = { QUICK: 10, NORMAL: 0, POWER: -20 };
        return Math.max(5, Math.min(95, 80 + (attackerPrec - defenderGuard) + modifiers[type]));
    }

    // 🔥 CHANGED: weapon base + type multiplier + stat bonus
    static calculateDamage(
        type: AttackType,
        scalingStatValue: number,
        weaponBase?: { min: number; max: number }
    ): number {
        const base = weaponBase ?? BARE_FIST_BASE;

        // Random roll within weapon base range
        const rawBase = base.min + Math.floor(Math.random() * (base.max - base.min + 1));

        // Apply attack type multiplier
        const multiplied = Math.floor(rawBase * ATTACK_MULTIPLIERS[type]);

        // Flat stat bonus — 0.5 per point feels meaningful
        const statBonus = Math.floor(scalingStatValue * 0.5);

        return Math.max(1, multiplied + statBonus); // always deal at least 1
    }

    static getChargeRange(dexterity: number): number {
        return Math.max(2, 1 + Math.floor(dexterity / 2));
    }

    static getActionCost(type: string): number {
        const costs: Record<string, number> = {
            QUICK: 5, NORMAL: 10, POWER: 20, CHARGE: 15, REST: 0, TAUNT: 0, MOVE: 5
        };
        return costs[type] || 0;
    }

    static getRestRecovery(): number {
        return 20;
    }
}