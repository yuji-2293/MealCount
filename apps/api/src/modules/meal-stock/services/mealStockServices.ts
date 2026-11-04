import type { D1Database } from '@cloudflare/workers-types';
import { mealStockRepository } from '../repositories/mealStockRepository';
import { getTodayJST } from '../../../utils/date';
import type { UpdateMealStockData } from '../schemas/mealStockSchemas';
import { calculateEstimatedStock } from '../functions/calculateEstimatedStock';

export const mealStockServices = {
  getMealStockById: async (d1: D1Database, id: number) => {
    // elapsedDays 取得処理
    const data = await mealStockRepository.findById(d1, id);
    if (!data) {
      throw new Error(`Meal stock with id ${id} not found`);
    }
    // 共通関数にdataを渡して推定在庫を計算
    const { elapsedDays, estimatedStock } = calculateEstimatedStock(
      data.last_calculated_date,
      data.current_meal_stock,
      data.daily_meal_count
    );
    return {
      ...data,
      elapsedDays,
      estimatedStock,
    };
  },
  updateMealStock: async (d1: D1Database, id: number, data: UpdateMealStockData) => {
    // idに紐づく既存のデータを取得
    const existingData = await mealStockRepository.findById(d1, id);
    if (!existingData) {
      return { afterMealStock: null };
    }

    const expectedVersion = data.version;
    const result = await mealStockRepository.update(
      id,

      {
        currentMealStock: data.currentMealStock,
        lastCalculatedDate: getTodayJST(),
        version: expectedVersion,
      },

      d1
    );
    if (!result.afterMealStock) {
      return { afterMealStock: null };
    }
    return result;
  },
};
