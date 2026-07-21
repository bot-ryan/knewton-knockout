// src/utils/CombatEngine.ts

export type AttackType = 'QUICK' | 'NORMAL' | 'POWER'

export class CombatEngine {

    // 1. Hit Calculation
    static calculateHit(attackerPrec: number, defenderGuard: number, type: AttackType): boolean {
        const modifiers: Record<AttackType, number> = {
            'QUICK': 10,    // +10% Accuracy
            'NORMAL': 0,    // Base
            'POWER': -20,   // -20% Accuracy
        };

        const baseChance = 80 + (attackerPrec - defenderGuard);
        const hitChance = Math.max(5, Math.min(95, baseChance + modifiers[type]));

        return (Math.random() * 100) <= hitChance;
    }

    // 2. Damage Calculation
    static calculateDamage(attackerStr: number, type: AttackType): number {
        const baseModifiers: Record<AttackType, number> = {
            'QUICK': 2,
            'NORMAL': 5,
            'POWER': 10,
            // CHARGE intentionally omitted — it uses NORMAL damage, see CombatScene
        };

        const base = baseModifiers[type] || 5;

        // Damage formula: Base Attack + (30% of Strength) + Random variance (0-2)
        return base + Math.floor(attackerStr * 0.3) + Math.floor(Math.random() * 3);
    }

    static getHitChance(attackerPrec: number, defenderGuard: number, type: AttackType): number {
        const modifiers: Record<AttackType, number> = {
            'QUICK': 10,
            'NORMAL': 0,
            'POWER': -20,
        };
        const baseChance = 80 + (attackerPrec - defenderGuard);
        return Math.max(5, Math.min(95, baseChance + (modifiers[type] || 0)));
    }

    static getActionCost(type: string): number {
        const costs: Record<string, number> = {
            'QUICK': 5, 'NORMAL': 10, 'POWER': 20, 'CHARGE': 15, 'REST': 0, 'TAUNT': 0, 'MOVE': 5
        };
        return costs[type] || 0;
    }

    static getRestRecovery(): number {
        return 20;
    }

    // 🔥 NEW: How far the player can lunge, scaled by dexterity
    static getChargeRange(dexterity: number): number {
        // Same formula as movement — dex governs both speed and lunge distance
         return Math.max(2, 1 + Math.floor(dexterity / 2)); // minimum range of 2
    }
}