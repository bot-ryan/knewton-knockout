// src/data/Relics/RelicPool.ts
import type { Relic } from './RelicTypes';

export const RELIC_POOL: Relic[] = [

    // --- BASIC RELICS ---
    {
        id: 'bloodstone',
        name: 'Bloodstone',
        description: 'Recover 5 HP each time you defeat an enemy.',
        trigger: 'on_kill',
        flavourText: 'Still warm.'
    },
    {
        id: 'war_drum',
        name: 'War Drum',
        description: 'REST recovers double stamina.',
        trigger: 'on_rest',
        flavourText: 'The rhythm steadies even the most exhausted fighter.'
    },
    {
        id: 'cracked_mirror',
        name: 'Cracked Mirror',
        description: '15% chance to negate incoming damage entirely.',
        trigger: 'on_damaged',
        flavourText: 'Bad luck? Depends on who you ask.'
    },
    {
        id: 'serpents_fang',
        name: "Serpent's Fang",
        description: 'QUICK attacks deal +3 bonus damage.',
        trigger: 'on_hit',
        flavourText: 'Small, fast, lethal.'
    },
    {
        id: 'cowards_coin',
        name: "Coward's Coin",
        description: 'Start every combat 2 grid squares further from the enemy.',
        trigger: 'combat_start',
        flavourText: 'Running is just strategy with better cardio.'
    },
    {
        id: 'iron_constitution',
        name: 'Iron Constitution',
        description: 'Permanently increases vitality.',
        trigger: 'passive',
        modifiers: [{ stat: 'vitality', value: 2 }],
        flavourText: 'Some people are just built different.'
    },
    {
        id: 'sharpened_mind',
        name: 'Sharpened Mind',
        description: 'Permanently increases precision.',
        trigger: 'passive',
        modifiers: [{ stat: 'precision', value: 3 }],
        flavourText: 'See the gap before it opens.'
    },

    // --- STUDENT SUBMISSIONS ---

    // Submitted by: Naquarius (probably)
    {
        id: 'curse_of_naquarius',
        name: 'Curse of Naquarius',
        description: 'A lingering miasma. Reduces strength, dexterity, and vitality.',
        trigger: 'passive',
        modifiers: [
            { stat: 'strength', value: -3 },
            { stat: 'dexterity', value: -3 },
            { stat: 'vitality', value: -3 }
        ],
        flavourText: 'It follows you. You know what it is. Everyone around you knows too.'
    },

    // Submitted by: the Tetris crew
    {
        id: 'tetr_sweat',
        name: 'Tetr Sweat',
        description: 'A cursed bottle of sweat collected from Jehoash, Noel and Mr Ryan during a Tetris session. Boosts dexterity but weakens vitality.',
        trigger: 'passive',
        modifiers: [
            { stat: 'dexterity', value: 4 },
            { stat: 'vitality', value: -2 }
        ],
        flavourText: '"We were in the zone," they insist. The smell says otherwise.'
    },
];