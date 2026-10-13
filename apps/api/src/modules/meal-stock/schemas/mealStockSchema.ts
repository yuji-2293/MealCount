import { z } from 'zod';

export const mealStockSchema = z.object({
  dairyMealCount: z.number().min(0),
  currentMealStock: z.number().min(0),
  lastCalculatedDate: z.string(),
});
