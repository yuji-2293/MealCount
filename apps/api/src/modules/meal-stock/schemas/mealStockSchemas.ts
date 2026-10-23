import { z } from 'zod';

export const mealStockSchema = z.object({
  currentMealStock: z.number().int().min(0).optional(),
  actualMealCount: z.number().int().min(0).optional(),
});

export type UpdateMealStockData = z.infer<typeof mealStockSchema>;
