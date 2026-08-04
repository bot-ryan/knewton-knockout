// src/data/Relics/RelicTypes.ts

import type { StatModifier } from "../Equipment/EquipmentTypes";

export type RelicTrigger = 
    | 'on_kill'
    | 'on_hit'
    | 'on_damaged'
    | 'on_rest'
    | 'combat_start'
    | 'passive';        // always active, no trigger

export interface Relic {
    id: string;
    name: string;
    description: string;    // plain english: "Recover 5 HP on kill"
    trigger: RelicTrigger;
    modifiers?: StatModifier[];  // optional stat modifiers that this relic applies
    flavourText?: string;
}