import { z } from "zod";

export const purchaseSchema = z.object({
  purchasedMealCount: z.number().positive().int(),
  sameDayAmount: z.number().nonnegative().int(),
  plannedAmount: z.number().nonnegative().int(),
  monthlyAmount: z.number().nonnegative().int(),
  purchaseDate: z.string(),
});

// purchaseSchema から型を自動的に推論して CreatePurchaseData 型を作成
export type PurchaseData = z.infer<typeof purchaseSchema>;
