import { z } from "zod";

export const purchaseSchema = z.object({
  purchasedMealCount: z.number().positive().int(),
  sameDayAmount: z.number().positive(),
  plannedAmount: z.number().positive(),
  monthlyAmount: z.number().positive(),
  purchaseDate: z.string(),
});

// purchaseSchema から型を自動的に推論して CreatePurchaseData 型を作成
export type CreatePurchaseData = z.infer<typeof purchaseSchema>;
