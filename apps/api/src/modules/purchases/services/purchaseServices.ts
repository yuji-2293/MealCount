// schema から推論された型をimport
import type { CreatePurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";
import type { D1Database } from "@cloudflare/workers-types";
import { purchaseRepository } from "@/modules/purchases/repositories/purchaseRepository";

type PurchaseAmounts = {
  totalAmount: number;
  totalRealAmount: number;
  oneMealCost: number;
};

const calculateTotalAmount = (data: CreatePurchaseData): PurchaseAmounts => {
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
};
