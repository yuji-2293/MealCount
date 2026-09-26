import { z } from "zod";

export const purchaseSchema = z.object({
  purchasedMealCount: z.number().nonnegative().int(),
  sameDayAmount: z.number(),
  plannedAmount: z.number(),
  monthlyAmount: z.number(),
  purchaseDate: z.string(),
});

// purchaseSchema から型を自動的に推論して CreatePurchaseData 型を作成
export type CreatePurchaseData = z.infer<typeof purchaseSchema>;
