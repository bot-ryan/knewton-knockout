// src/data/Enemy/EnemyIdentity.ts

import Phaser from 'phaser';
import { faker } from '@faker-js/faker';
import { type EnemyTemplate } from './EnemyArchetypes'; // 🔥 FIXED: Case-sensitive accurate import path
import { type Expression } from '../playerData'; // Assumes playerData lives in src/playerData.ts

export interface EnemyIdentity {
    name: string;
    skinColor: number;
    expression: Expression;
    hairStyle: number;
}

export function generateEnemyIdentity(enemy: EnemyTemplate): EnemyIdentity {
    // ----------------------------------------------------
    // 👶 TIER 1: BEGINNER (Pathetic, chaotic, funny names)
    // ----------------------------------------------------
    if (enemy.tier === 'BEGINNER') {
        const beginnerAdjectives = ['Clumsy', 'Sloppy', 'Weeping', 'Shaking', 'Confused', 'Fumbling', 'Regretful', 'Silly'];
        const funnyNouns = ['Goose', 'Weasel', 'Novice', 'Toad', 'Couch-Potato', 'Soft-Shell', 'Bumbler'];
        
        const firstName = faker.person.firstName();
        const adj = Phaser.Utils.Array.GetRandom(beginnerAdjectives);
        const noun = Phaser.Utils.Array.GetRandom(funnyNouns);
        
        return {
            name: `${firstName} the ${adj} ${noun}`,
            skinColor: Math.floor(Math.random() * 0xffffff),
            expression: Phaser.Utils.Array.GetRandom(['nervous', 'fearful', 'sad', 'happy']) as Expression,
            hairStyle: Math.floor(Math.random() * 5) + 1
        };
    }

    // ----------------------------------------------------
    // 🪵 TIER 2: STANDARD (Gritty, classic gladiator names)
    // ----------------------------------------------------
    if (enemy.tier === 'STANDARD') {
        const warriorAdjectives = ['Scarred', 'Grizzled', 'Brutal', 'Iron', 'Rowdy', 'Reckless', 'Sturdy', 'Merciless', 'Grim'];
        const weaponTypes = ['Gladius', 'Trident', 'Shield', 'Blade', 'Brawler', 'Striker', 'Slayer'];
        
        const firstName = faker.person.firstName();
        const adj = Phaser.Utils.Array.GetRandom(warriorAdjectives);
        const weapon = Phaser.Utils.Array.GetRandom(weaponTypes);
        
        return {
            name: `${firstName} the ${adj} ${weapon}`,
            skinColor: Math.floor(Math.random() * 0xffffff),
            expression: Phaser.Utils.Array.GetRandom(['poker', 'determined', 'smirk', 'wink']) as Expression,
            hairStyle: Math.floor(Math.random() * 5) + 1
        };
    }

    // ----------------------------------------------------
    // 👑 TIER 3: ELITE (Curated, fixed, prestigious looks)
    // ----------------------------------------------------
    if (enemy.tier === 'ELITE') {
        switch (enemy.archetype) {
            case 'JUGGERNAUT':
                return {
                    name: enemy.displayName,
                    skinColor: 0x4a0e17, // Deep crimson
                    expression: 'angry',
                    hairStyle: 3
                };
                
            case 'SKIRMISHER':
                return {
                    name: enemy.displayName,
                    skinColor: 0x111111, // Pitch black
                    expression: 'smirk',
                    hairStyle: 2
                };
                
            case 'WACKY_BALANCED':
                return {
                    name: enemy.displayName,
                    skinColor: 0xffffff, // Stark white
                    expression: 'poker',
                    hairStyle: 1
                };
        }
    }

    // 💀 TIER 4: BOSS FALLBACK 
    // Since we are ignoring bosses for now, this safely catches them 
    // without crashing, handing them a default epic name and clean slate visual.
    return { 
        name: enemy.displayName, 
        skinColor: 0x9aa4b2, 
        expression: 'poker', 
        hairStyle: 1 
    };
}