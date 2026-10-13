import type { D1Database } from '@cloudflare/workers-types';
import { mealStockRepository } from '../repositories/mealStockRepository';

export const mealStockServices = {
  getMealStockById: async (d1: D1Database, id: number) => {
    const data = await mealStockRepository.findById(d1, id);
    if (!data) {
      throw new Error(`Meal stock with id ${id} not found`);
    }
    const now = new Date();
    const lastCalculatedDate = data.last_calculated_date;
    const elapsedDays = Math.floor(
      (now.getTime() - new Date(lastCalculatedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(`meal stock with id: -> id = ${id}: day =  ${elapsedDays}`);
    console.log(`現在の日時: -> ${now}`);
    console.log(`最後に計算された日時: -> ${lastCalculatedDate}`);
    return {
      ...data,
      elapsedDays,
    };
  },
};
