export interface EnemyTemplate {
    archetype: string;
    displayName: string;
    baseHp: number;
    baseStamina: number;
    baseStr: number; // Affects damage
    baseAgi: number; // Affects speed/initiative
    baseVit: number; // Affects block/mitigation
    description: string;
}

export const ENEMY_POOL: EnemyTemplate[] = [
    {
        archetype: 'JUGGERNAUT',
        displayName: 'Murmillo Bruiser',
        baseHp: 120, baseStamina: 80, baseStr: 14, baseAgi: 6, baseVit: 15,
        description: 'Slow, heavily armored, and packs a wallop. Do not trade blows directly.'
    },
    {
        archetype: 'SKIRMISHER',
        displayName: 'Thracian Dual-Wielder',
        baseHp: 80, baseStamina: 120, baseStr: 8, baseAgi: 16, baseVit: 6,
        description: 'Incredibly fast. Will out-stamina you if you try to chase them.'
    },
    {
        archetype: 'WACKY_BALANCED',
        displayName: 'The Balanced Mime',
        baseHp: 100, baseStamina: 100, baseStr: 10, baseAgi: 10, baseVit: 10,
        description: 'Perfectly balanced, as all things should be. Creepily average.'
    }
];