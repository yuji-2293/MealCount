// schema から推論された型をimport
import type { CreatePurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";
import type { D1Database } from "@cloudflare/workers-types";
import { purchaseRepository } from "@/modules/purchases/repositories/purchaseRepository";

export const calculatePurchaseService = {
  calculateAmount: async (data: CreatePurchaseData, d1: D1Database) => {
    const result = await purchaseRepository.create(data, d1);

    const totalAmount =
      data.sameDayAmount + data.plannedAmount + data.monthlyAmount;
    const totalRealAmount = data.sameDayAmount + data.plannedAmount;
    const oneMealCost = totalRealAmount / data.purchasedMealCount;
    return {
      totalAmount,
      totalRealAmount,
      oneMealCost,
      id: result.id,
      purchasedMealCount: result.purchased_meal_count,
      sameDayAmount: result.same_day_amount,
      plannedAmount: result.planned_amount,
      monthlyAmount: result.monthly_amount,
      purchaseDate: result.purchase_date,
    };
  },
};
