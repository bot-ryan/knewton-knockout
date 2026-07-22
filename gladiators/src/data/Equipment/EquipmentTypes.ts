// src/data/Equipment/EquipmentTypes.ts
import type { StatKey } from '../../types/models';

export type EquipmentSlot = 'weapon' | 'shield' | 'accessory';
export type WeaponType = 'dagger' | 'sword' | 'mace' | 'spear' | 'crossbow';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type EnemyTier = 'beginner' | 'standard' | 'elite' | 'boss';

export interface StatRequirement {
    stat: StatKey;
    value: number;
}

export interface StatModifier {
    stat: string;
    value: number;
}

export interface Equipment {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    rarity: Rarity;
    tier: EnemyTier;        // which tier of combat drops this
    requirement?: StatRequirement;
    modifiers: StatModifier[];
    weaponType?: WeaponType;
    attackRange?: number;
    flavourText?: string;
}