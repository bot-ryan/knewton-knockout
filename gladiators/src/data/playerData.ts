// src/data/PlayerData.ts
import { createStore } from 'zustand/vanilla';
import { type StatKey, type Expression } from '../types/models';
import type { Equipment } from './Equipment/EquipmentTypes';
import type { Relic } from './Relics/RelicTypes';


export interface PlayerData {
  name: string;
  gold: number;
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
  relics: Relic[]; // max 5, enforced in the store action
  equipment: {
    weapon: Equipment | null;
    offhand: Equipment | null;
    accessory: Equipment | null;
  }
}

// 1. Define the Store's State (Data + Actions)
interface PlayerStoreState extends PlayerData {
  setPlayerData: (data: Partial<PlayerData>) => void;
  updateSecondaryStats: (stats: Partial<PlayerData['secondaryStats']>) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean; // — returns false if insufficient
  addRelic: (relic: Relic) => boolean;   // returns false if already at 5
  swapRelic: (remove: string, add: Relic) => boolean;  // drop one, gain one
}

// 2. Create the Zustand Store
export const usePlayerStore = createStore<PlayerStoreState>((set, get) => ({
  name: '',
  gold: 0,
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
  relics: [],       // max 5, enforced in the store action
  equipment: {
    weapon: null,
    offhand: null,
    accessory: null
  },

  // Action to merge top-level data
  setPlayerData: (data) => set((state) => ({ ...state, ...data })),



  // Action to specifically merge secondary stats (like taking damage)
  updateSecondaryStats: (stats) => set((state) => ({
    secondaryStats: { ...state.secondaryStats, ...stats }
  })),

  //call this when enemy is defeated
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),

  // call this in shop, returns false if player can't afford it
  spendGold: (amount) => {
    if (get().gold < amount) return false;
    set((state) => ({ gold: state.gold - amount }));
    return true;
  },

  addRelic: (relic) => {
    const currentRelics = get().relics;
    if (currentRelics.length >= 5) return false; // can't add more than 5
    set((state) => ({ relics: [...state.relics, relic] }));
    return true;
  },

  swapRelic: (removeId, addRelic) => {
    let success = false;

    set((state) => {
      const newRelics = state.relics.filter(r => r.id !== removeId);

      // If the item wasn't found and we are already at max, abort the swap
      if (newRelics.length >= 5) {
        return state;
      }

      success = true;
      return { relics: [...newRelics, addRelic] };
    });

    return success;


  }
}));