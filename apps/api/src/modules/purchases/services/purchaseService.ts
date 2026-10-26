// schema から推論された型をimport
import type { CreatePurchaseData, UpdatePurchaseData } from '../schemas/purchaseSchemas';
import type { D1Database } from '@cloudflare/workers-types';
import { purchaseRepository } from '../repositories/purchaseRepository';
import type { PurchaseAmounts, CalculateAmounts } from '../types/purchaseTypes';
import { calculateEstimatedStock } from '../../meal-stock/functions/calculateEstimatedStock';
import { mealStockRepository } from '../../meal-stock/repositories/mealStockRepository';
import { getTodayJST } from '../../../utils/date';
import { drizzle } from 'drizzle-orm/d1';

// 購入金額の合計や1食あたりの金額を計算する関数
const calculateTotalAmount = (data: CalculateAmounts): PurchaseAmounts => {
  const totalAmount = data.sameDayAmount + data.plannedAmount + data.monthlyAmount;
  const totalRealAmount = data.sameDayAmount + data.plannedAmount;
  const oneMealCost = totalRealAmount / data.purchasedMealCount;
  return {
    totalAmount,
    totalRealAmount,
    oneMealCost,
  };
};

export const purchaseService = {
  createPurchase: async (data: CreatePurchaseData, d1: D1Database) => {
    // dataを受け取って関数に渡し、購入金額の合計や1食あたりの金額を計算
    const amounts = calculateTotalAmount(data);

    // postされたpurchaseMealCountに基づいてmealStockを更新するための処理
    const existingData = await mealStockRepository.findByUserId(d1, data.userId);
    if (!existingData) {
      throw new Error(`Meal stock for user id ${data.userId} not found`);
    }

    // 推定在庫を計算
    const { estimatedStock } = calculateEstimatedStock(
      existingData.last_calculated_date,
      existingData.current_meal_stock,
      existingData.daily_meal_count
    );
    // 確定在庫を計算
    const confirmedStock = estimatedStock + data.purchasedMealCount;

    // 在庫を反映してmealStockを更新
    const db = drizzle(d1);
    const purchaseQuery = purchaseRepository.buildCreateQuery(db, data);
    const mealStockQuery = mealStockRepository.buildUpdateQuery(db, existingData.id, {
      currentMealStock: confirmedStock,
      lastCalculatedDate: getTodayJST(),
    });

    // cloudflare D1のbatchでmealStockとpurchaseを同時に作成と更新を行う
    const [mealStockRows, purchaseRows] = await db.batch([mealStockQuery, purchaseQuery]);
    // batchの結果を確認し、失敗していればエラーを投げる
    if (mealStockRows.length === 0) {
      throw new Error('Failed to update meal stock');
    }
    if (purchaseRows.length === 0) {
      throw new Error('Failed to create purchase');
    }

    // batchの結果を配列から取り出して、それぞれの結果を返す
    const mealStockResult = mealStockRows[0];
    const purchaseResult = purchaseRows[0];

    return {
      purchase: {
        id: purchaseResult.id,
        purchaseDate: purchaseResult.purchase_date,
        sameDayAmount: purchaseResult.same_day_amount,
        plannedAmount: purchaseResult.planned_amount,
        monthlyAmount: purchaseResult.monthly_amount,
        purchasedMealCount: purchaseResult.purchased_meal_count,
        createdAt: purchaseResult.created_at,
        updatedAt: purchaseResult.updated_at,
      },

      amounts,

      mealStock: {
        id: mealStockResult.id,
        currentMealStock: mealStockResult.current_meal_stock,
        lastCalculatedDate: mealStockResult.last_calculated_date,
        dailyMealCount: mealStockResult.daily_meal_count,
        updatedAt: mealStockResult.updated_at,
      },
    };
  },

  getAllPurchases: async (d1: D1Database) => {
    const all = await purchaseRepository.findAll(d1);

    const allWithAmounts = all.map((data) => {
      const calculated: CalculateAmounts = {
        sameDayAmount: data.same_day_amount,
        plannedAmount: data.planned_amount,
        monthlyAmount: data.monthly_amount,
        purchasedMealCount: data.purchased_meal_count,
      };
      const amounts = calculateTotalAmount(calculated);
      return {
        purchase: {
          id: data.id,
          purchaseDate: data.purchase_date,
          sameDayAmount: data.same_day_amount,
          plannedAmount: data.planned_amount,
          monthlyAmount: data.monthly_amount,
          purchasedMealCount: data.purchased_meal_count,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        amounts,
      };
    });
    return allWithAmounts;
  },

  findPurchaseById: async (id: number, d1: D1Database) => {
    const data = await purchaseRepository.findById(id, d1);
    if (!data) {
      return null;
    }
    const calculated: CalculateAmounts = {
      sameDayAmount: data.same_day_amount,
      plannedAmount: data.planned_amount,
      monthlyAmount: data.monthly_amount,
      purchasedMealCount: data.purchased_meal_count,
    };
    const amounts = calculateTotalAmount(calculated);
    return {
      purchase: {
        id: data.id,
        purchaseDate: data.purchase_date,
        sameDayAmount: data.same_day_amount,
        plannedAmount: data.planned_amount,
        monthlyAmount: data.monthly_amount,
        purchasedMealCount: data.purchased_meal_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      amounts,
    };
  },

  updatePurchase: async (id: number, data: UpdatePurchaseData, d1: D1Database) => {
    const result = await purchaseRepository.update(id, data, d1);
    if (!result) {
      return null;
    }
    const updateCalculated: CalculateAmounts = {
      sameDayAmount: result.same_day_amount,
      plannedAmount: result.planned_amount,
      monthlyAmount: result.monthly_amount,
      purchasedMealCount: result.purchased_meal_count,
    };
    const amounts = calculateTotalAmount(updateCalculated);
    return {
      purchase: {
        id: result.id,
        purchaseDate: result.purchase_date,
        sameDayAmount: result.same_day_amount,
        plannedAmount: result.planned_amount,
        monthlyAmount: result.monthly_amount,
        purchasedMealCount: result.purchased_meal_count,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
      amounts,
    };
  },

  deletePurchase: async (id: number, d1: D1Database) => {
    const result = await purchaseRepository.delete(id, d1);
    if (!result) {
      return null;
    }
    return result;
  },
};
