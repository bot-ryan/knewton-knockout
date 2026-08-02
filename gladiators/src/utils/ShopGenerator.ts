// src/utils/ShopGenerator.ts
import { getEquipmentPoolForTier, getRandomBySlot } from '../data/Equipment/EquipmentPools';
import type { Equipment, EnemyTier, Rarity } from '../data/Equipment/EquipmentTypes';
import type { Relic } from '../data/Relics/RelicTypes';

export interface ShopItem {
    type:      'equipment' | 'relic';
    equipment?: Equipment;
    relic?:     Relic;
    price:     number;
    sold:      boolean; // tracks if already purchased this visit
}

const PRICE_BY_RARITY: Record<Rarity, [number, number]> = {
    common:    [40,  70],
    uncommon:  [70,  120],
    rare:      [120, 180],
    legendary: [180, 280]
};

const RELIC_PRICE_RANGE: [number, number] = [80, 150];

export class ShopGenerator {

    static generateShop(tier: EnemyTier, relicPool: Relic[]): ShopItem[] {
        const pool  = getEquipmentPoolForTier(tier);
        const items: ShopItem[] = [];

        // One of each equipment slot — guaranteed variety
        const slots: Equipment['slot'][] = ['weapon', 'shield', 'accessory'];
        slots.forEach(slot => {
            const item  = getRandomBySlot(pool, slot);
            items.push({
                type:      'equipment',
                equipment: item,
                price:     ShopGenerator.rollPrice(item.rarity),
                sold:      false
            });
        });

        // Two random relics
        const shuffled = [...relicPool].sort(() => Math.random() - 0.5);
        shuffled.slice(0, 2).forEach(relic => {
            items.push({
                type:  'relic',
                relic,
                price: ShopGenerator.rollPrice(undefined, true),
                sold:  false
            });
        });

        return items;
    }

    private static rollPrice(rarity?: Rarity, isRelic = false): number {
        const [min, max] = isRelic
            ? RELIC_PRICE_RANGE
            : PRICE_BY_RARITY[rarity ?? 'common'];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}