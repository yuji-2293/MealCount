// schema から推論された型をimport
import type { CreatePurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";

export const calculatePurchaseService = {
  calculateAmount: async (data: CreatePurchaseData) => {
    const totalAmount =
      data.sameDayAmount + data.plannedAmount + data.monthlyAmount;
    const totalRealAmount = data.sameDayAmount + data.plannedAmount;
    const oneMealCost = totalRealAmount / data.purchasedMealCount;
    return { totalAmount, totalRealAmount, oneMealCost };
  },
};
