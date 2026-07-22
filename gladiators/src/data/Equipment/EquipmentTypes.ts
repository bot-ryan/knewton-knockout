// src/data/Equipment/EquipmentTypes.ts

import type { StatKey } from "../../types/models";

export type EquipmentSlot = 'weapon' | 'shield' | 'accessory';
export type WeaponType = 'dagger' | 'sword' | 'mace' | 'spear' | 'crossbow';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface StatRequirement {
    stat: StatKey;
    value: number;    // soft requirement — penalty below this, not a hard block
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
    requirement?: StatRequirement;
    modifiers: StatModifier[];
    // Weapon-specific — only populated when slot === 'weapon'
    weaponType?: WeaponType;
    attackRange?: number;   // 1 = melee, 2 = reach, 3+ = ranged
    flavourText?: string;
}