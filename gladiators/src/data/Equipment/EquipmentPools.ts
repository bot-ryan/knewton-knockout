// src/data/Equipment/EquipmentPools.ts
import { WEAPON_POOL } from './pools/WeaponPool';
import { SHIELD_POOL } from './pools/ShieldPool';
import { ACCESSORY_POOL } from './pools/AccessoryPool';
import type { Equipment, EnemyTier } from './EquipmentTypes';

// All equipment combined
const ALL_EQUIPMENT: Equipment[] = [
    ...WEAPON_POOL,
    ...SHIELD_POOL,
    ...ACCESSORY_POOL
];

// Tier hierarchy — higher tiers can also drop lower tier gear
const TIER_ORDER: EnemyTier[] = ['beginner', 'standard', 'elite', 'boss'];

export function getEquipmentPoolForTier(tier: EnemyTier): Equipment[] {
    const tierIndex = TIER_ORDER.indexOf(tier);
    // Include current tier and all tiers below it
    const eligibleTiers = TIER_ORDER.slice(0, tierIndex + 1);
    return ALL_EQUIPMENT.filter(e => eligibleTiers.includes(e.tier));
}

// If you want slot-specific draws (guaranteed one of each slot type)
export function getRandomBySlot(pool: Equipment[], slot: Equipment['slot']): Equipment {
    const filtered = pool.filter(e => e.slot === slot);
    return filtered[Math.floor(Math.random() * filtered.length)];
}