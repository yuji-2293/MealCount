// schema から推論された型をimport
import type {
  CreatePurchaseData,
  UpdatePurchaseData,
} from '@/modules/purchases/schemas/purchaseSchemas';
import type { D1Database } from '@cloudflare/workers-types';
import { purchaseRepository } from '@/modules/purchases/repositories/purchaseRepository';
import type { PurchaseAmounts, CalculateAmounts } from '@/modules/purchases/types/purchaseTypes';

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
    const result = await purchaseRepository.create(data, d1);

    const amounts = calculateTotalAmount(data);
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
    const result = await purchaseRepository.update(id, d1, data);
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
