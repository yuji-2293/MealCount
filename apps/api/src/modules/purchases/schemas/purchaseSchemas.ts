import { z } from 'zod';

export const purchaseSchema = z.object({
  purchasedMealCount: z.number().positive().int(),
  sameDayAmount: z.number().nonnegative().int(),
  plannedAmount: z.number().nonnegative().int(),
  monthlyAmount: z.number().nonnegative().int(),
  purchaseDate: z.string(),
});

// 部分的に更新可能なスキーマを定義, partialを使用して全てのフィールドをoptionalにする
export const updatePurchaseSchema = purchaseSchema.partial();

// purchaseSchema から型を自動的に推論して CreatePurchaseData 型を作成
export type CreatePurchaseData = z.infer<typeof purchaseSchema>;
export type UpdatePurchaseData = z.infer<typeof updatePurchaseSchema>;
