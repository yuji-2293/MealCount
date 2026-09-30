// schema から推論された型をimport
import type { CreatePurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";
import type { D1Database } from "@cloudflare/workers-types";
import { purchaseRepository } from "@/modules/purchases/repositories/purchaseRepository";
import type {
  PurchaseAmounts,
  CalculateAmounts,
  ReturnCalculatedAmounts,
} from "@/modules/purchases/types/purchaseTypes";

const calculateTotalAmount = (data: CalculateAmounts): PurchaseAmounts => {
  const totalAmount =
    data.sameDayAmount + data.plannedAmount + data.monthlyAmount;
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
      result,
      amounts,
    };
  },
  getAllPurchases: async (d1: D1Database) => {
    const all = await purchaseRepository.findAll(d1);

    const allWithAmounts = all.map((data) => {
      const calculated: CalculateAmounts = {
        purchaseDate: data.purchase_date,
        sameDayAmount: data.same_day_amount,
        plannedAmount: data.planned_amount,
        monthlyAmount: data.monthly_amount,
        purchasedMealCount: data.purchased_meal_count,
      };
      const amounts = calculateTotalAmount(calculated);
      return {
        purchase: data,
        amounts: {
          totalAmount: amounts.totalAmount,
          totalRealAmount: amounts.totalRealAmount,
          oneMealCost: amounts.oneMealCost,
        },
      };
    });
    return allWithAmounts;
  },
};
