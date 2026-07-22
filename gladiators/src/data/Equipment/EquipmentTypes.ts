// src/data/Equipment/EquipmentTypes.ts

import type { StatKey } from "../../types/models";

export type EquipmentSlot = 'weapon' | 'offhand' | 'armour' | 'accessory';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface StatRequirement {
    stat: StatKey;    // e.g. 'strength'
    value: number;    // minimum value to use without penalty
}

export interface StatModifier {
    stat: string;     // which stat it changes
    value: number;    // flat bonus (negative = penalty)
}

export interface Equipment {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    rarity: Rarity;
    requirement?: StatRequirement;   // optional — some items have no requirement
    modifiers: StatModifier[];       // what stats it changes when equipped
    flavourText?: string;            // optional lore line
}