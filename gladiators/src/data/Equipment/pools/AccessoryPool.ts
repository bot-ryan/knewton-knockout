// src/data/Equipment/pools/AccessoryPool.ts
import type { Equipment } from '../EquipmentTypes';

export const ACCESSORY_POOL: Equipment[] = [

    // --- BEGINNER TIER ---
    {
        id: 'leather_band',
        name: 'Leather Band',
        description: 'Simple wristguard.',
        slot: 'accessory',
        rarity: 'common',
        tier: 'beginner',
        modifiers: [
            { stat: 'stamina', value: 10 }  // flat stamina bonus
        ]
    },
    {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        description: 'Feels warm in your hand.',
        slot: 'accessory',
        rarity: 'common',
        tier: 'beginner',
        modifiers: [
            { stat: 'precision', value: 2 }
        ],
        flavourText: 'Luck is just precision you haven\'t earned yet.'
    },

    // --- STANDARD TIER ---
    {
        id: 'swift_ring',
        name: 'Swift Ring',
        description: 'Everything feels slightly faster.',
        slot: 'accessory',
        rarity: 'uncommon',
        tier: 'standard',
        modifiers: [
            { stat: 'dexterity', value: 3 },
            { stat: 'stamina', value: 8 }
        ]
    },
    {
        id: 'iron_will_band',
        name: 'Iron Will Band',
        description: 'Stamina burns slower.',
        slot: 'accessory',
        rarity: 'uncommon',
        tier: 'standard',
        modifiers: [
            { stat: 'stamina', value: 20 },
            { stat: 'vitality', value: 1 }
        ],
        flavourText: 'Endurance is its own weapon.'
    },

    // --- ELITE TIER ---
    {
        id: 'precision_lens',
        name: 'Precision Lens',
        description: 'You see gaps you didn\'t before.',
        slot: 'accessory',
        rarity: 'rare',
        tier: 'elite',
        modifiers: [
            { stat: 'precision', value: 5 },
            { stat: 'guard', value: -2 }
        ],
        flavourText: 'Seeing everything means defending nothing.'
    },
];