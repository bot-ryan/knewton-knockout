// src/data/Enemy/EnemyArchetypes.ts

export interface EnemyTemplate {
    archetype: string;
    displayName: string;
    baseHp: number;
    baseStamina: number;
    // Grouped to perfectly mirror PlayerData stats
    stats: {
        strength: number;
        dexterity: number;
        precision: number;
        guard: number;
        vitality: number;
        arcane: number;
    };
    description: string;
    tier: 'BOSS' | 'ELITE' | 'STANDARD' | 'BEGINNER';
}

export const BEGINNER_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'DRUNKEN_FOOL',
        displayName: 'Inebriated Retiarius',
        baseHp: 12, baseStamina: 25,
        stats: { strength: 1, dexterity: 1, precision: 1, guard: 0, vitality: 1, arcane: 0 },
        description: 'Tripping over his own net and slurring insults.',
        tier: 'BEGINNER'
    },
    {
        archetype: 'SCARED_SLAVE',
        displayName: 'Terrified Convict',
        baseHp: 10, baseStamina: 30,
        stats: { strength: 1, dexterity: 2, precision: 1, guard: 1, vitality: 0, arcane: 0 },
        description: 'Trembling so hard he might drop his dagger.',
        tier: 'BEGINNER'
    },
    {
        archetype: 'MALNOURISHED_RECRUIT',
        displayName: 'Starving Murmillo',
        baseHp: 15, baseStamina: 20,
        stats: { strength: 2, dexterity: 1, precision: 1, guard: 1, vitality: 1, arcane: 0 },
        description: 'Weak from prison rations.',
        tier: 'BEGINNER'
    }
];

export const STANDARD_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'RECRUIT',
        displayName: 'Standard Pit Fighter',
        baseHp: 38, baseStamina: 55,
        stats: { strength: 5, dexterity: 5, precision: 5, guard: 5, vitality: 4, arcane: 0 },
        description: 'A disciplined fighter with balanced stats.',
        tier: 'STANDARD'
    },
    {
        archetype: 'LIGHT_PUNISHER',
        displayName: 'Dimachaerus Skirmisher',
        baseHp: 26, baseStamina: 80,
        stats: { strength: 4, dexterity: 10, precision: 8, guard: 2, vitality: 2, arcane: 0 },
        description: 'Fast, relentless dual-wielder.',
        tier: 'STANDARD'
    },
    {
        archetype: 'ROOKIE_SHIELD',
        displayName: 'Samnite Sentry',
        baseHp: 50, baseStamina: 40,
        stats: { strength: 6, dexterity: 2, precision: 3, guard: 10, vitality: 8, arcane: 0 },
        description: 'Anchored behind a heavy tower shield.',
        tier: 'STANDARD'
    }
];

export const ELITE_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'JUGGERNAUT',
        displayName: 'Elite Murmillo Veteran',
        baseHp: 130, baseStamina: 90,
        stats: { strength: 15, dexterity: 4, precision: 8, guard: 12, vitality: 16, arcane: 0 },
        description: 'A terrifying colosseum champion.',
        tier: 'ELITE'
    },
    {
        archetype: 'SKIRMISHER',
        displayName: 'Thracian Blood-Dancer',
        baseHp: 85, baseStamina: 130,
        stats: { strength: 9, dexterity: 18, precision: 15, guard: 8, vitality: 5, arcane: 0 },
        description: 'Incredibly fast elite combatant.',
        tier: 'ELITE'
    },
    {
        archetype: 'WACKY_BALANCED',
        displayName: 'The Elite Grandmaster Mime',
        baseHp: 105, baseStamina: 105,
        stats: { strength: 11, dexterity: 11, precision: 11, guard: 11, vitality: 11, arcane: 11 },
        description: 'Perfectly balanced, as all things should be.',
        tier: 'ELITE'
    }
];

export const BOSS_ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'ARENA_CHAMPION_1',
        displayName: '🚨 [BOSS] Ignis the Decimator',
        baseHp: 350, baseStamina: 200,
        stats: { strength: 25, dexterity: 10, precision: 18, guard: 15, vitality: 20, arcane: 5 },
        description: 'The reigning Champion of the Lower Tier.',
        tier: 'BOSS'
    },
    {
        archetype: 'RIVAL_HOUSE_LEADER',
        displayName: '🚨 [BOSS] Prefect Malakar',
        baseHp: 280, baseStamina: 250,
        stats: { strength: 18, dexterity: 22, precision: 22, guard: 18, vitality: 14, arcane: 10 },
        description: 'The elite representative from the rival faction.',
        tier: 'BOSS'
    }
];