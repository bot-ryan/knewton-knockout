// src/data/PlayerData.ts
import { createStore } from 'zustand/vanilla';
import { type StatKey, type Expression } from '../types/models';


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
    hp: { current: number; max: number };
    mp: { current: number; max: number };
    stamina: { current: number; max: number };
    atk: { min: number; max: number };
    speed: number;
    block: number;
    hitChance: number;
    crit: number;
  };
}

// 1. Define the Store's State (Data + Actions)
interface PlayerStoreState extends PlayerData {
  setPlayerData: (data: Partial<PlayerData>) => void;
  updateSecondaryStats: (stats: Partial<PlayerData['secondaryStats']>) => void;
}

// 2. Create the Zustand Store
export const usePlayerStore = createStore<PlayerStoreState>((set) => ({
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
    hp: { current: 0, max: 0 },
    mp: { current: 0, max: 0 },
    stamina: { current: 0, max: 0 },
    atk: { min: 0, max: 0 },
    speed: 0,
    block: 0,
    hitChance: 0,
    crit: 0
  },
  
  // Action to merge top-level data
  setPlayerData: (data) => set((state) => ({ ...state, ...data })),
  
  // Action to specifically merge secondary stats (like taking damage)
  updateSecondaryStats: (stats) => set((state) => ({
      secondaryStats: { ...state.secondaryStats, ...stats }
  }))
}));