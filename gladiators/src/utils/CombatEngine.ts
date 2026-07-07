// src/utils/CombatEngine.ts

export type AttackType = 'QUICK' | 'NORMAL' | 'POWER' | 'CHARGE';

export class CombatEngine {
    
    // 1. Hit Calculation
    static calculateHit(attackerPrec: number, defenderGuard: number, type: AttackType): boolean {
        const modifiers: Record<AttackType, number> = {
            'QUICK': 10,    // +10% Accuracy
            'NORMAL': 0,    // Base
            'POWER': -20,   // -20% Accuracy
            'CHARGE': 0     // Base
        };

        const baseChance = 80 + (attackerPrec - defenderGuard);
        const hitChance = Math.max(5, Math.min(95, baseChance + modifiers[type]));
        
        return (Math.random() * 100) <= hitChance;
    }

    // 2. Damage Calculation (Moved from CombatScene!)
    static calculateDamage(attackerStr: number, type: AttackType): number {
        const baseModifiers: Record<AttackType, number> = { 
            'QUICK': 2, 
            'NORMAL': 5, 
            'POWER': 10,
            'CHARGE': 5 
        };
        
        const base = baseModifiers[type] || 5;
        
        // Damage formula: Base Attack + (30% of Strength) + Random variance (0-2)
        return base + Math.floor(attackerStr * 0.3) + Math.floor(Math.random() * 3);
    }
}