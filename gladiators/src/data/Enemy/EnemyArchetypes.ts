// src/data/Enemy/EnemyArchetypes.ts

export interface EnemyTemplate {
    archetype: string;
    displayName: string;
    baseHp: number;
    baseStamina: number;
    baseStr: number;
    baseAgi: number;
    baseVit: number;
    description: string;
    tier: 'BOSS' | 'ELITE' | 'STANDARD' | 'BEGINNER';
}

export const BEGINNER_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'DRUNKEN_FOOL',
        displayName: 'Inebriated Retiarius',
        baseHp: 12, baseStamina: 25, baseStr: 1, baseAgi: 1, baseVit: 1,
        description: 'Tripping over his own net and slurring insults.',
        tier: 'BEGINNER'
    },
    {
        archetype: 'SCARED_SLAVE',
        displayName: 'Terrified Convict',
        baseHp: 10, baseStamina: 30, baseStr: 1, baseAgi: 2, baseVit: 0,
        description: 'Trembling so hard he might drop his dagger.',
        tier: 'BEGINNER'
    },
    {
        archetype: 'MALNOURISHED_RECRUIT',
        displayName: 'Starving Murmillo',
        baseHp: 15, baseStamina: 20, baseStr: 2, baseAgi: 1, baseVit: 1,
        description: 'Weak from prison rations.',
        tier: 'BEGINNER'
    }
];

export const STANDARD_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'RECRUIT',
        displayName: 'Standard Pit Fighter',
        baseHp: 38, baseStamina: 55, baseStr: 5, baseAgi: 5, baseVit: 4,
        description: 'A disciplined fighter with balanced stats.',
        tier: 'STANDARD'
    },
    {
        archetype: 'LIGHT_PUNISHER',
        displayName: 'Dimachaerus Skirmisher',
        baseHp: 26, baseStamina: 80, baseStr: 4, baseAgi: 10, baseVit: 2,
        description: 'Fast, relentless dual-wielder.',
        tier: 'STANDARD'
    },
    {
        archetype: 'ROOKIE_SHIELD',
        displayName: 'Samnite Sentry',
        baseHp: 50, baseStamina: 40, baseStr: 6, baseAgi: 3, baseVit: 8,
        description: 'Anchored behind a heavy tower shield.',
        tier: 'STANDARD'
    }
];

export const ELITE_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'JUGGERNAUT',
        displayName: 'Elite Murmillo Veteran',
        baseHp: 130, baseStamina: 90, baseStr: 15, baseAgi: 5, baseVit: 16,
        description: 'A terrifying colosseum champion.',
        tier: 'ELITE'
    },
    {
        archetype: 'SKIRMISHER',
        displayName: 'Thracian Blood-Dancer',
        baseHp: 85, baseStamina: 130, baseStr: 9, baseAgi: 18, baseVit: 5,
        description: 'Incredibly fast elite combatant.',
        tier: 'ELITE'
    },
    // 🔥 FIXED: Restored the missing Mime!
    {
        archetype: 'WACKY_BALANCED',
        displayName: 'The Elite Grandmaster Mime',
        baseHp: 105, baseStamina: 105, baseStr: 11, baseAgi: 11, baseVit: 11,
        description: 'Perfectly balanced, as all things should be.',
        tier: 'ELITE'
    }
];

export const BOSS_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'ARENA_CHAMPION_1',
        displayName: '🚨 [BOSS] Ignis the Decimator',
        baseHp: 350, baseStamina: 200, baseStr: 25, baseAgi: 12, baseVit: 20,
        description: 'The reigning Champion of the Lower Tier.',
        tier: 'BOSS'
    },
    {
        archetype: 'RIVAL_HOUSE_LEADER',
        displayName: '🚨 [BOSS] Prefect Malakar',
        baseHp: 280, baseStamina: 250, baseStr: 18, baseAgi: 22, baseVit: 14,
        description: 'The elite representative from the rival faction.',
        tier: 'BOSS'
    }
];