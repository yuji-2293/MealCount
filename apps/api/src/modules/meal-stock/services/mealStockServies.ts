import type { D1Database } from '@cloudflare/workers-types';
import { mealStockRepository } from '../repositories/mealStockRepository';

export const mealStockServices = {
  findById: async (d1: D1Database, id: number) => {
    const data = await mealStockRepository.findById(d1, id);
    if (!data) {
      throw new Error(`Meal stock with id ${id} not found`);
    }
    return data;
  },
};
