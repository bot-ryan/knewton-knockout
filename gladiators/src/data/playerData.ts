// src/data/playerData.ts

export type StatKey = 'strength' | 'dexterity' | 'precision' | 'guard' | 'vitality' | 'arcane';
export type Expression = 'poker' | 'happy' | 'sad' | 'angry' | 'wink' | 'determined' | 'battle_cry' | 'smirk' | 'fearful' | 'nervous';

export interface PlayerData {
    name: string;
    appearance: {
        skinColor: number;
        hairColor: number;
        hairStyle: number;
        expression: Expression;
    };
    stats: Record<StatKey, number>;
    secondaryStats: {
        hp: number;
        mp: number;
        atk: { min: number; max: number };
        speed: number;
        block: number;
        hitChance: number;
        crit: number;
    };
}

// The global object that will hold your character's data
export const playerData: PlayerData = {
    name: '',
    appearance: {
        skinColor: 0x3498db,
        hairColor: 0x8B4513,
        hairStyle: 1,
        expression: 'poker'
    },
    stats: {
        strength: 1, dexterity: 1, precision: 1, guard: 1, vitality: 1, arcane: 1
    },
    secondaryStats: {
        hp: 0, mp: 0, atk: { min: 0, max: 0 }, speed: 0, block: 0, hitChance: 0, crit: 0
    }
};

// A helper function to easily overwrite the data
export function setPlayerData(data: PlayerData) {
    Object.assign(playerData, data);
}