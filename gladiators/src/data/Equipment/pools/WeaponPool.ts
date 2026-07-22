// src/data/Equipment/pools/WeaponPool.ts
import type { Equipment } from '../EquipmentTypes';

export const WEAPON_POOL: Equipment[] = [

    // --- BEGINNER TIER ---
    {
        id: 'rusty_dagger',
        name: 'Rusty Dagger',
        description: 'Worn down but still cuts.',
        slot: 'weapon',
        weaponType: 'dagger',
        attackRange: 1,
        rarity: 'common',
        tier: 'beginner',
        requirement: { stat: 'strength', value: 1 },
        modifiers: [
            { stat: 'precision', value: 2 }
        ],
        flavourText: 'Better than nothing.'
    },
    {
        id: 'wooden_club',
        name: 'Wooden Club',
        description: 'Heavy swing, no finesse.',
        slot: 'weapon',
        weaponType: 'mace',
        attackRange: 1,
        rarity: 'common',
        tier: 'beginner',
        requirement: { stat: 'strength', value: 2 },
        modifiers: [
            { stat: 'strength', value: 2 },
            { stat: 'dexterity', value: -1 }
        ],
        flavourText: 'From the looks of it, someone already used this on someone.'
    },
    {
        id: 'short_sword',
        name: 'Short Sword',
        description: 'Balanced and reliable.',
        slot: 'weapon',
        weaponType: 'sword',
        attackRange: 1,
        rarity: 'common',
        tier: 'beginner',
        requirement: { stat: 'strength', value: 2 },
        modifiers: [
            { stat: 'strength', value: 1 },
            { stat: 'precision', value: 1 }
        ],
        flavourText: 'The arena staple.'
    },

    // --- STANDARD TIER ---
    {
        id: 'iron_spear',
        name: 'Iron Spear',
        description: 'Strike before they close the gap.',
        slot: 'weapon',
        weaponType: 'spear',
        attackRange: 2,             // can attack at distance 2
        rarity: 'uncommon',
        tier: 'standard',
        requirement: { stat: 'strength', value: 4 },
        modifiers: [
            { stat: 'strength', value: 2 },
            { stat: 'dexterity', value: 1 },
            { stat: 'precision', value: -1 }
        ],
        flavourText: 'Reach is its own kind of power.'
    },
    {
        id: 'battle_axe',
        name: 'Battle Axe',
        description: 'Devastating on a clean hit.',
        slot: 'weapon',
        weaponType: 'mace',
        attackRange: 1,
        rarity: 'uncommon',
        tier: 'standard',
        requirement: { stat: 'strength', value: 5 },
        modifiers: [
            { stat: 'strength', value: 4 },
            { stat: 'precision', value: -2 }
        ],
        flavourText: 'Accuracy is for people who can\'t hit hard enough.'
    },

    // --- ELITE TIER ---
    {
        id: 'gladius',
        name: 'Gladius',
        description: 'The weapon of champions.',
        slot: 'weapon',
        weaponType: 'sword',
        attackRange: 1,
        rarity: 'rare',
        tier: 'elite',
        requirement: { stat: 'strength', value: 6 },
        modifiers: [
            { stat: 'strength', value: 3 },
            { stat: 'precision', value: 3 }
        ],
        flavourText: 'Forged for the arena. Proven in it.'
    },
    {
        id: 'hunters_crossbow',
        name: 'Hunter\'s Crossbow',
        description: 'Distance is no longer safety.',
        slot: 'weapon',
        weaponType: 'crossbow',
        attackRange: 4,             // ignores distance almost entirely
        rarity: 'rare',
        tier: 'elite',
        requirement: { stat: 'precision', value: 6 },
        modifiers: [
            { stat: 'precision', value: 4 },
            { stat: 'strength', value: -2 }
        ],
        flavourText: 'The crowd goes quiet when it\'s raised.'
    },
];