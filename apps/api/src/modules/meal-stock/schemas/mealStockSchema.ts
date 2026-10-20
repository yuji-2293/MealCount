import { z } from 'zod';

export const mealStockSchema = z.object({
  dailyMealCount: z.number().min(0),
  currentMealStock: z.number().min(0),
  lastCalculatedDate: z.string(),
});

export type UpdateMealStockData = z.infer<typeof mealStockSchema>;
