// schema から推論された型をimport
import type { PurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";
import type { D1Database } from "@cloudflare/workers-types";
import { purchaseRepository } from "@/modules/purchases/repositories/purchaseRepository";
import type { PurchaseAmounts } from "@/modules/purchases/types/purchaseTypes";

const calculateTotalAmount = (data: PurchaseData): PurchaseAmounts => {
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
  createPurchase: async (data: PurchaseData, d1: D1Database) => {
    const result = await purchaseRepository.create(data, d1);

    const amounts = calculateTotalAmount(data);
    return {
      result,
      amounts,
    };
  },
  getAllPurchases: async (d1: D1Database) => {
    const all = await purchaseRepository.findAll(d1);
    return all;
  },
};
