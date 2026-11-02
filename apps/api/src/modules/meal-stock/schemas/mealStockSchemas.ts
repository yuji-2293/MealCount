import { z } from 'zod';

export const mealStockSchema = z.object({
  currentMealStock: z.number().int().min(0).optional(),
  version: z.coerce.number().nonnegative().int().optional(),
});

export type UpdateMealStockData = z.infer<typeof mealStockSchema>;
