// src/utils/CombatEngine.ts

export type AttackType = 'QUICK' | 'NORMAL' | 'POWER';

export class CombatEngine {

    static calculateHit(attackerPrec: number, defenderGuard: number, type: AttackType): boolean {
        return Math.random() * 100 <= CombatEngine.getHitChance(attackerPrec, defenderGuard, type);
    }

    static getHitChance(attackerPrec: number, defenderGuard: number, type: AttackType): number {
        const modifiers: Record<AttackType, number> = { QUICK: 10, NORMAL: 0, POWER: -20 };
        return Math.max(5, Math.min(95, 80 + (attackerPrec - defenderGuard) + modifiers[type]));
    }

    // 🔥 CHANGED: scalingValue is now optional — falls back to strength if not passed
    static calculateDamage(
        attackerStr: number,
        type: AttackType,
        scalingValue?: number
    ): number {
        const baseModifiers: Record<AttackType, number> = { QUICK: 2, NORMAL: 5, POWER: 10 };
        const base = baseModifiers[type];

        // Use scalingValue if provided, otherwise fall back to strength
        const statValue = scalingValue ?? attackerStr;
        return base + Math.floor(statValue * 0.3) + Math.floor(Math.random() * 3);
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