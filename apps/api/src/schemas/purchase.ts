import { z } from "zod";

export const purchaseSchema = z.object({
  purchasedMealCount: z.number().nonnegative().int(),
  sameDayAmount: z.number(),
  plannedAmount: z.number(),
  monthlyAmount: z.number(),
  purchaseDate: z.string(),
});
