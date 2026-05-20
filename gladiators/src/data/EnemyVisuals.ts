// src/data/EnemyVisuals.ts

import Phaser from 'phaser';
import { type EnemyTemplate } from './EnemyArchetypes';
import { type Expression } from '../data/playerData';

export interface EnemyLook {
    skinColor: number;
    expression: Expression;
    hairStyle: number;
}

export function generateEnemyLook(enemy: EnemyTemplate): EnemyLook {
    // 🎲 1. CHAOTIC RANDOMIZATION (Beginner & Standard)
    if (enemy.tier === 'BEGINNER' || enemy.tier === 'STANDARD') {
        const standardExpressions: Expression[] = ['poker', 'happy', 'sad', 'angry', 'wink', 'smirk', 'nervous', 'fearful'];
        
        return {
            // Generates a completely random hex color
            skinColor: Math.floor(Math.random() * 0xffffff), 
            expression: Phaser.Utils.Array.GetRandom(standardExpressions),
            hairStyle: Math.floor(Math.random() * 5) + 1 // 1 to 5
        };
    }

    // 👑 2. UNIQUE, FIXED CURATED LOOKS (Elites)
    if (enemy.tier === 'ELITE') {
        switch (enemy.archetype) {
            case 'JUGGERNAUT':
                return {
                    skinColor: 0x4a0e17,   // Deep, dried-blood crimson
                    expression: 'angry',   // Permanently furious
                    hairStyle: 3           // Mohawk/Heavy style
                };
                
            case 'SKIRMISHER':
                return {
                    skinColor: 0x111111,   // Shadow/Pitch black body
                    expression: 'smirk',   // Arrogant, mocking grin
                    hairStyle: 2           // Wild, spiky hair
                };
                
            case 'WACKY_BALANCED':
                return {
                    skinColor: 0xffffff,   // Stark white (classic mime)
                    expression: 'poker',   // Deadpan expressionless void
                    hairStyle: 1           // Neat, slicked back hair
                };
        }
    }

    // Fallback default just in case
    return { skinColor: 0x9aa4b2, expression: 'poker', hairStyle: 1 };
}