import { z } from 'zod';

export const UpdateMealStockSchema = z.object({
  id: z.coerce.number().int().positive(),
  currentMealStock: z.number().int().min(0),
  version: z.number().nonnegative().int(),
});
export const getMealStockSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type UpdateMealStockData = z.infer<typeof UpdateMealStockSchema>;
