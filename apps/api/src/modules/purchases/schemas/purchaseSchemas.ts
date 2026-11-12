import { z } from 'zod';

export const purchaseSchema = z.object({
  id: z.coerce.number().int().positive(),
  purchasedMealCount: z.number().positive().int(),
  sameDayAmount: z.number().nonnegative().int(),
  plannedAmount: z.number().nonnegative().int(),
  monthlyAmount: z.number().nonnegative().int(),
  purchaseDate: z.string(),
  userId: z.number().int().positive(),
  version: z.number().nonnegative().int().optional(),
});

// 部分的に更新可能なスキーマを定義, partialを使用して全てのフィールドをoptionalにする
export const updatePurchaseSchema = purchaseSchema
  // 部分的に更新可能にするために partial を使用
  .partial()
  // omitでuserIdを除外
  .omit({ userId: true })
  // id と version を必須にする
  .required({ id: true, version: true })
  // strictモードを有効にして、未知のフィールドを許可しないようにする
  .strict();
export const getPurchaseSchema = purchaseSchema.pick({ id: true });
export const deletePurchaseSchema = z.object({
  id: z.coerce.number().int().positive(),
  version: z.coerce.number().nonnegative().int(),
});
// purchaseSchema から型を自動的に推論して CreatePurchaseData 型を作成
export type CreatePurchaseData = z.infer<typeof purchaseSchema>;
export type UpdatePurchaseData = z.infer<typeof updatePurchaseSchema>;
