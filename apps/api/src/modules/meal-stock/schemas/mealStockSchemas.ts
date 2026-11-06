import { z } from 'zod';

export const UpdateMealStockSchema = z.object({
  currentMealStock: z.number().int().min(0),
  version: z.number().nonnegative().int(),
});
export type UpdateMealStockData = z.infer<typeof UpdateMealStockSchema>;
