import type { D1Database } from '@cloudflare/workers-types';
import { mealStockRepository } from '../repositories/mealStockRepository';
import { getTodayJST } from '../../../utils/date';
import type { UpdateMealStockData } from '../schemas/mealStockSchemas';
import { calculateEstimatedStock } from '../functions/calculateEstimatedStock';

export const mealStockServices = {
  getMealStock: async (d1: D1Database, userId: string) => {
    const data = await mealStockRepository.findByUserId(d1, userId);
    if (!data) {
      return { status: 'not_found' as const };
    }
    // 共通関数にdataを渡して推定在庫を計算
    const { elapsedDays, estimatedStock, estimatedDepletionDate, estimatedNumber } =
      calculateEstimatedStock(
        data.last_calculated_date,
        data.current_meal_stock,
        data.daily_meal_count
      );
    const estimatedDepletionString = estimatedDepletionDate.toISOString().split('T')[0];
    return {
      dailyMealCount: data.daily_meal_count,
      currentMealStock: data.current_meal_stock,
      lastCalculatedDate: data.last_calculated_date,
      version: data.version,
      elapsedDays,
      estimatedStock,
      estimatedDepletionDate: estimatedDepletionString,
      estimatedNumber,
    };
  },
  updateMealStock: async (
    d1: D1Database,
    id: number,
    data: UpdateMealStockData,
    userId: string
  ) => {
    // idに紐づく既存のデータを取得
    const existingData = await mealStockRepository.findById(d1, id, userId);
    if (!existingData) {
      return { status: 'not_found' as const };
    }

    const expectedVersion = data.version;
    const result = await mealStockRepository.update(
      id,

      {
        currentMealStock: data.currentMealStock,
        lastCalculatedDate: getTodayJST(),
        version: expectedVersion,
      },

      d1,
      userId
    );
    if (!result.afterMealStock) {
      return { status: 'conflict' as const, afterMealStock: null };
    }
    return result;
  },
};
