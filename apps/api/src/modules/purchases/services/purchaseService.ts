// schema から推論された型をimport
import type { CreatePurchaseData, UpdatePurchaseData } from '../schemas/purchaseSchemas';
import type { D1Database } from '@cloudflare/workers-types';
import { purchaseRepository } from '../repositories/purchaseRepository';
import type { PurchaseAmounts, CalculateAmounts } from '../types/purchaseTypes';
import { mealStockRepository } from '../../meal-stock/repositories/mealStockRepository';

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

    // 更新用idを取得
    const mealStockId = existingData.id;
    const { mealStock, purchase } = await purchaseRepository.createWithMealStock(
      data,
      d1,
      mealStockId
    );

    return {
      purchase: {
        id: purchase.id,
        purchaseDate: purchase.purchase_date,
        sameDayAmount: purchase.same_day_amount,
        plannedAmount: purchase.planned_amount,
        monthlyAmount: purchase.monthly_amount,
        purchasedMealCount: purchase.purchased_meal_count,
        version: purchase.version,
        createdAt: purchase.created_at,
        updatedAt: purchase.updated_at,
      },

      amounts,

      mealStock: {
        id: mealStock.id,
        currentMealStock: mealStock.current_meal_stock,
        lastCalculatedDate: mealStock.last_calculated_date,
        dailyMealCount: mealStock.daily_meal_count,
        updatedAt: mealStock.updated_at,
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
          version: data.version,
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
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      amounts,
    };
  },

  updatePurchase: async (id: number, data: UpdatePurchaseData, d1: D1Database) => {
    // 更新前のpurchaseを取得
    const existingPurchase = await purchaseRepository.findById(id, d1);
    if (!existingPurchase) {
      throw new Error('Purchase not found');
    }
    // 更新前のユーザーIDを取得
    const userId = existingPurchase.user_id;
    // 更新前のユーザーのmealStockを取得
    const existingMealStock = await mealStockRepository.findByUserId(d1, userId);
    if (!existingMealStock) {
      throw new Error('Meal stock not found for the user');
    }

    const expectedVersion = data.version;
    const { afterPurchase } = await purchaseRepository.update(id, data, d1, expectedVersion);

    const updateCalculated: CalculateAmounts = {
      sameDayAmount: afterPurchase.same_day_amount,
      plannedAmount: afterPurchase.planned_amount,
      monthlyAmount: afterPurchase.monthly_amount,
      purchasedMealCount: afterPurchase.purchased_meal_count,
    };
    const amounts = calculateTotalAmount(updateCalculated);
    return {
      purchase: {
        id: afterPurchase.id,
        purchaseDate: afterPurchase.purchase_date,
        sameDayAmount: afterPurchase.same_day_amount,
        plannedAmount: afterPurchase.planned_amount,
        monthlyAmount: afterPurchase.monthly_amount,
        purchasedMealCount: afterPurchase.purchased_meal_count,
        version: afterPurchase.version,
        createdAt: afterPurchase.created_at,
        updatedAt: afterPurchase.updated_at,
      },
      amounts,
    };
  },

  deletePurchase: async (id: number, version: number, d1: D1Database) => {
    // 削除前の購入情報を取得
    const existingPurchase = await purchaseRepository.findById(id, d1);
    if (!existingPurchase) {
      throw new Error('Purchase not found');
    }

    const expectedVersion = version;
    const deletedPurchase = await purchaseRepository.delete(id, d1, expectedVersion);
    if (!deletedPurchase) {
      return null;
    }
    return {
      deletedPurchase,
    };
  },
};
