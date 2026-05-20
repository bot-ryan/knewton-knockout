// src/data/enemyArchetype.ts

export interface EnemyTemplate {
    archetype: string;
    displayName: string;
    baseHp: number;
    baseStamina: number;
    baseStr: number; // Affects damage
    baseAgi: number; // Affects speed/initiative
    baseVit: number; // Affects block/mitigation
    description: string;
    tier: 'BOSS' | 'ELITE' | 'STANDARD' | 'BEGINNER'; // 🔥 Fully integrated tiers
    
}

/**
 * 👶 BEGINNER POOL (Levels 1–2)
 * Pure tutorial fodder. Extremely low HP, virtually zero damage. 
 * Unlosable unless the player walks away from the keyboard to make a sandwich.
 */
export const BEGINNER_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'DRUNKEN_FOOL',
        displayName: 'Inebriated Retiarius',
        baseHp: 12, baseStamina: 25, baseStr: 1, baseAgi: 1, baseVit: 1,
        description: 'Tripping over his own net and slurring insults. He is practically defeating himself.',
        tier: 'BEGINNER'
    },
    {
        archetype: 'SCARED_SLAVE',
        displayName: 'Terrified Convict',
        baseHp: 10, baseStamina: 30, baseStr: 1, baseAgi: 2, baseVit: 0,
        description: 'He clearly does not want to be here. Trembling so hard he might drop his dagger.',
        tier: 'BEGINNER'
    },
    {
        archetype: 'MALNOURISHED_RECRUIT',
        displayName: 'Starving Murmillo',
        baseHp: 15, baseStamina: 20, baseStr: 2, baseAgi: 1, baseVit: 1,
        description: 'Weak from prison rations. His wooden training shield looks heavier than he is.',
        tier: 'BEGINNER'
    }
];

/**
 * 🪵 STANDARD POOL (Levels 3–5)
 * Tweaked UP! The player has earned some House Points and leveled up.
 * These guys now require basic tactical awareness and proper stamina management.
 */
export const STANDARD_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'RECRUIT',
        displayName: 'Standard Pit Fighter',
        baseHp: 38, baseStamina: 55, baseStr: 5, baseAgi: 5, baseVit: 4,
        description: 'A disciplined fighter with balanced stats. Will capitalize on your mistakes.',
        tier: 'STANDARD'
    },
    {
        archetype: 'LIGHT_PUNISHER',
        displayName: 'Dimachaerus Skirmisher',
        baseHp: 26, baseStamina: 80, baseStr: 4, baseAgi: 10, baseVit: 2,
        description: 'Fast, relentless dual-wielder. Can unleash multiple quick strikes if ignored.',
        tier: 'STANDARD'
    },
    {
        archetype: 'ROOKIE_SHIELD',
        displayName: 'Samnite Sentry',
        baseHp: 50, baseStamina: 40, baseStr: 6, baseAgi: 3, baseVit: 8,
        description: 'Anchored behind a heavy tower shield. Harder to break down, but slow to react.',
        tier: 'STANDARD'
    }
];

/**
 * 👑 ELITE POOL (Mid-to-Late Run) 
 * Players only face these if they purposely join Elite combats
 * Elite threats that test optimized builds and mechanical knowledge.
 */
export const ELITE_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'JUGGERNAUT',
        displayName: 'Elite Murmillo Veteran',
        baseHp: 130, baseStamina: 90, baseStr: 15, baseAgi: 5, baseVit: 16,
        description: 'A terrifying colosseum champion. Heavily armored and packs a fatal wallop.',
        tier: 'ELITE'
    },
    {
        archetype: 'SKIRMISHER',
        displayName: 'Thracian Blood-Dancer',
        baseHp: 85, baseStamina: 130, baseStr: 9, baseAgi: 18, baseVit: 5,
        description: 'Incredibly fast elite combatant. Will easily out-stamina careless players.',
        tier: 'ELITE'
    }
];

/**
 * 💀 BOSS POOL (Floor Climaxes / Run Finales)
 * Empty shell structures waiting for your unique scaling logic and special moves.
 */
export const BOSS_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'ARENA_CHAMPION_1',
        displayName: '🚨 [BOSS] Ignis the Decimator',
        baseHp: 350, baseStamina: 200, baseStr: 25, baseAgi: 12, baseVit: 20,
        description: 'The reigning Champion of the Lower Tier. His weapon glows with white-hot fury.',
        tier: 'BOSS'
    },
    {
        archetype: 'RIVAL_HOUSE_LEADER',
        displayName: '🚨 [BOSS] Prefect Malakar',
        baseHp: 280, baseStamina: 250, baseStr: 18, baseAgi: 22, baseVit: 14,
        description: 'The elite representative from the rival faction. Ruthless, calculating, and fast.',
        tier: 'BOSS'
    }
];