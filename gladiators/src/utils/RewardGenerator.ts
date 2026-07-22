// src/utils/RewardGenerator.ts
import type { Equipment } from '../data/Equipment/EquipmentTypes';
import { getEquipmentPoolForTier, getRandomBySlot } from '../data/Equipment/EquipmentPools';

export type RewardType = 'equipment' | 'healing' | 'money';

export interface RewardCard {
    type: RewardType;
    label: string;
    description: string;
    equipment?: Equipment;
    healAmount?: number;
    goldAmount?: number;
}

export type EnemyTier = 'beginner' | 'standard' | 'elite' | 'boss';

const GOLD_RANGES: Record<EnemyTier, [number, number]> = {
    beginner: [3,  10],
    standard: [8,  18],
    elite:    [15, 30],
    boss:     [40, 60]
};

export class RewardGenerator {

    static rollGold(tier: EnemyTier): number {
        const [min, max] = GOLD_RANGES[tier];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 🔥 CHANGED: removed equipmentPool parameter — pool is now resolved internally
    static generateCards(tier: EnemyTier): RewardCard[] {
        const combinations: RewardType[][] = [
            ['equipment', 'equipment', 'equipment'],
            ['equipment', 'equipment', 'healing'],
            ['equipment', 'equipment', 'money'],
            ['equipment', 'healing',   'money'],
        ];

        const chosen = combinations[Math.floor(Math.random() * combinations.length)];
        return chosen.map(type => this.buildCard(type, tier));
    }

    // 🔥 CHANGED: removed equipmentPool parameter, now uses getEquipmentPoolForTier
    // and getRandomBySlot to guarantee slot variety across the 3 cards
    private static buildCard(type: RewardType, tier: EnemyTier): RewardCard {
        switch (type) {
            case 'equipment': {
                const pool = getEquipmentPoolForTier(tier);

                // Pick a random slot first, then pick an item from that slot
                // This prevents drawing 3 weapons in a row
                const slots: Equipment['slot'][] = ['weapon', 'shield', 'accessory'];
                const slot = slots[Math.floor(Math.random() * slots.length)];
                const item = getRandomBySlot(pool, slot);

                return {
                    type: 'equipment',
                    label: item.name,
                    description: item.description,
                    equipment: item
                };
            }

            case 'healing': {
                const healAmount = 0.4;
                return {
                    type: 'healing',
                    label: 'Field Dressing',
                    description: `Restore 40% of your max HP.`,
                    healAmount
                };
            }

            case 'money': {
                const goldAmount = Math.floor(Math.random() * 16) + 10;
                return {
                    type: 'money',
                    label: 'Coin Pouch',
                    description: `Gain ${goldAmount} bonus gold.`,
                    goldAmount
                };
            }
        }
    }
}