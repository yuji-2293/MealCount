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
    const { mealStock, purchase } = await purchaseRepository.createWithMealStock(
      data,
      d1,
      existingData.id,
      confirmedStock
    );

    // -------ここからrepositoryに切り出す--------------

    // // 在庫を反映してmealStockを更新
    // const db = drizzle(d1);
    // const purchaseQuery = purchaseRepository.buildCreateQuery(db, data);
    // const mealStockQuery = mealStockRepository.buildUpdateQuery(db, existingData.id, {
    //   currentMealStock: confirmedStock,
    //   lastCalculatedDate: getTodayJST(),
    // });

    // // cloudflare D1のbatchでmealStockとpurchaseを同時に作成と更新を行う
    // const [mealStockRows, purchaseRows] = await db.batch([mealStockQuery, purchaseQuery]);
    // // batchの結果を確認し、失敗していればエラーを投げる
    // if (mealStockRows.length === 0 || purchaseRows.length === 0) {
    //   throw new Error('Failed to update meal stock or create purchase');
    // }

    // // batchの結果を配列から取り出して、それぞれの結果を返す
    // const mealStockResult = mealStockRows[0];
    // const purchaseResult = purchaseRows[0];

    return {
      purchase: {
        id: purchase.id,
        purchaseDate: purchase.purchase_date,
        sameDayAmount: purchase.same_day_amount,
        plannedAmount: purchase.planned_amount,
        monthlyAmount: purchase.monthly_amount,
        purchasedMealCount: purchase.purchased_meal_count,
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

    // 更新前の購入食数を取得
    const beforeCount = existingPurchase.purchased_meal_count;

    // 更新前の推定在庫食数を計算
    const { estimatedStock } = calculateEstimatedStock(
      existingMealStock.last_calculated_date,
      existingMealStock.current_meal_stock,
      existingMealStock.daily_meal_count
    );

    // 更新後の購入食数を取得
    const afterCount = data.purchasedMealCount ?? beforeCount;

    // 更新後の購入食数の差分を計算し、確定在庫食数を計算
    const estimatedCount = afterCount - beforeCount;
    const estimatedAfterMealStock = Math.max(0, estimatedStock + estimatedCount);

    // 更新後の在庫食数をbatchで更新
    const db = drizzle(d1);
    const purchaseQuery = purchaseRepository.buildUpdateQuery(db, id, data);
    const mealStockQuery = mealStockRepository.buildUpdateQuery(db, existingMealStock.id, {
      currentMealStock: estimatedAfterMealStock,
      lastCalculatedDate: getTodayJST(),
    });

    const [purchaseRows, mealStockRows] = await db.batch([purchaseQuery, mealStockQuery]);
    if (purchaseRows.length === 0 || mealStockRows.length === 0) {
      throw new Error('Failed to update meal stock or purchase');
    }

    const purchaseResult = purchaseRows[0];
    const mealStockResult = mealStockRows[0];

    const updateCalculated: CalculateAmounts = {
      sameDayAmount: purchaseResult.same_day_amount,
      plannedAmount: purchaseResult.planned_amount,
      monthlyAmount: purchaseResult.monthly_amount,
      purchasedMealCount: purchaseResult.purchased_meal_count,
    };
    const amounts = calculateTotalAmount(updateCalculated);
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
        currentMealStock: mealStockResult.current_meal_stock,
        lastCalculatedDate: mealStockResult.last_calculated_date,
        dailyMealCount: mealStockResult.daily_meal_count,
      },
    };
  },

  deletePurchase: async (id: number, d1: D1Database) => {
    // 削除前の購入情報を取得
    const existingPurchase = await purchaseRepository.findById(id, d1);
    if (!existingPurchase) {
      throw new Error('Purchase not found');
    }
    // 削除前のユーザーIDを取得
    const userId = existingPurchase.user_id;
    // 削除前のユーザーの在庫情報を取得
    const existingMealStock = await mealStockRepository.findByUserId(d1, userId);
    if (!existingMealStock) {
      throw new Error('Meal stock not found for the user');
    }
    // 削除前の購入食数を取得
    const mealCount = existingPurchase.purchased_meal_count;

    // 削除前の推定在庫食数を計算
    const { estimatedStock } = calculateEstimatedStock(
      existingMealStock.last_calculated_date,
      existingMealStock.current_meal_stock,
      existingMealStock.daily_meal_count
    );

    // 削除後の購入食数の差分を計算し、確定在庫食数を計算
    const estimatedCount = estimatedStock - mealCount;
    const estimatedAfterMealStock = Math.max(0, estimatedCount);

    // 削除後の在庫食数をbatchで更新
    const db = drizzle(d1);
    const purchaseQuery = purchaseRepository.buildDeleteQuery(db, id);
    const mealStockQuery = mealStockRepository.buildUpdateQuery(db, existingMealStock.id, {
      currentMealStock: estimatedAfterMealStock,
      lastCalculatedDate: getTodayJST(),
    });

    const [purchaseRows, mealStockRows] = await db.batch([purchaseQuery, mealStockQuery]);
    if (purchaseRows.length === 0 || mealStockRows.length === 0) {
      throw new Error('Failed to delete purchase or update meal stock');
    }
    const deletedPurchase = purchaseRows[0];
    const updatedMealStock = mealStockRows[0];
    return {
      deletedPurchase,
      updatedMealStock,
    };
  },
};
