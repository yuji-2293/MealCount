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
    const existingData = await mealStockRepository.findById(d1, id);
    if (!existingData) {
      throw new Error(`Meal stock with id ${id} not found`);
    }

    const { calculatedStock } = calculateEstimatedStock(
      existingData.last_calculated_date,
      existingData.current_meal_stock,
      existingData.daily_meal_count
    );

    // 更新用のdataから補正値を計算する
    // actualMealCount が指定されていれば,デフォルトの daily_meal_count との差分を補正値とする
    const adjustment =
      data.actualMealCount === undefined ? 0 : existingData.daily_meal_count - data.actualMealCount;

    // 補正値を在庫に反映
    const confirmedStock = data.currentMealStock ?? Math.max(0, calculatedStock + adjustment);

    const result = await mealStockRepository.update(
      id,

      {
        currentMealStock: confirmedStock,
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
