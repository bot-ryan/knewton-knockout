// src/data/Equipment/pools/ShieldPool.ts
import type { Equipment } from '../EquipmentTypes';

export const SHIELD_POOL: Equipment[] = [

    // --- BEGINNER TIER ---
    {
        id: 'wooden_buckler',
        name: 'Wooden Buckler',
        description: 'Light and easy to carry.',
        slot: 'shield',
        rarity: 'common',
        tier: 'beginner',
        requirement: { stat: 'strength', value: 1 },
        modifiers: [
            { stat: 'guard', value: 2 }
        ],
        flavourText: 'Splinters eventually. Until then, it holds.'
    },
    {
        id: 'iron_shield',
        name: 'Iron Shield',
        description: 'Heavy but dependable.',
        slot: 'shield',
        rarity: 'common',
        tier: 'beginner',
        requirement: { stat: 'strength', value: 3 },
        modifiers: [
            { stat: 'guard', value: 4 },
            { stat: 'dexterity', value: -1 }
        ],
        flavourText: 'Someone survived a lot with this.'
    },

    // --- STANDARD TIER ---
    {
        id: 'kite_shield',
        name: 'Kite Shield',
        description: 'Broad coverage, solid build.',
        slot: 'shield',
        rarity: 'uncommon',
        tier: 'standard',
        requirement: { stat: 'strength', value: 4 },
        modifiers: [
            { stat: 'guard', value: 5 },
            { stat: 'vitality', value: 1 }
        ],
        flavourText: 'Worn by survivors.'
    },
    {
        id: 'spiked_shield',
        name: 'Spiked Shield',
        description: 'Blocking is its own attack.',
        slot: 'shield',
        rarity: 'uncommon',
        tier: 'standard',
        requirement: { stat: 'strength', value: 4 },
        modifiers: [
            { stat: 'guard', value: 3 },
            { stat: 'strength', value: 2 }
        ],
        flavourText: 'The spikes aren\'t decorative.'
    },

    // --- ELITE TIER ---
    {
        id: 'tower_shield',
        name: 'Tower Shield',
        description: 'Almost a wall.',
        slot: 'shield',
        rarity: 'rare',
        tier: 'elite',
        requirement: { stat: 'strength', value: 7 },
        modifiers: [
            { stat: 'guard', value: 8 },
            { stat: 'dexterity', value: -2 },
            { stat: 'vitality', value: 2 }
        ],
        flavourText: 'The crowd hates how boring it makes fights.'
    },
];