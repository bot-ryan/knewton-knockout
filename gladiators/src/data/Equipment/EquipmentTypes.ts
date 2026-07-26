// src/data/Equipment/EquipmentTypes.ts

export type EquipmentSlot = 'weapon' | 'shield' | 'accessory';
export type WeaponType = 'dagger' | 'sword' | 'mace' | 'spear' | 'crossbow';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type EnemyTier = 'beginner' | 'standard' | 'elite' | 'boss';
export type ScalingStat =
    | 'strength'
    | 'dexterity'
    | 'arcane'
    | Array<'strength' | 'dexterity' | 'arcane'>;

export interface StatRequirement {
    stat: string;
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
    tier: EnemyTier;
    requirement?: StatRequirement;
    modifiers: StatModifier[];
    weaponType?: WeaponType;
    attackRange?: number;
    scalingStat?: ScalingStat;
    baseDamage?: { min: number; max: number }; // 🔥 NEW — weapons only
    flavourText?: string;
}