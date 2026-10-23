import type { D1Database } from '@cloudflare/workers-types';
import { mealStockRepository } from '../repositories/mealStockRepository';
import { getTodayJST } from '../../../utils/date';
import type { UpdateMealStockData } from '../schemas/mealStockSchemas';

export const mealStockServices = {
  getMealStockById: async (d1: D1Database, id: number) => {
    // elapsedDays 取得処理
    const data = await mealStockRepository.findById(d1, id);
    if (!data) {
      throw new Error(`Meal stock with id ${id} not found`);
    }
    const now = new Date(getTodayJST());
    const lastCalculatedDate = data.last_calculated_date;
    const elapsedDays = Math.max(
      0,
      Math.floor((now.getTime() - new Date(lastCalculatedDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    // currentMealStock 取得処理
    const currentMealStock = Math.max(
      0,
      data.current_meal_stock - data.daily_meal_count * elapsedDays
    );
    return {
      ...data,
      elapsedDays,
      currentMealStock,
    };
  },
  updateMealStock: async (d1: D1Database, id: number, data: UpdateMealStockData) => {
    const existingData = await mealStockRepository.findById(d1, id);
    if (!existingData) {
      throw new Error(`Meal stock with id ${id} not found`);
    }

    const result = await mealStockRepository.update(
      id,

      {
        currentMealStock: data.currentMealStock,
        lastCalculatedDate: getTodayJST(),
      },

      d1
    );
    if (!result) {
      throw new Error(`Failed to update meal stock with id ${id}`);
    }
    return result;
  },
};
