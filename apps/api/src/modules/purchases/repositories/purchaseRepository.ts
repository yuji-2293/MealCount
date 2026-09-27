import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import type { CreatePurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";
import { purchases } from "@/db/schema";

export const purchaseRepository = {
  create: async (data: CreatePurchaseData, d1: D1Database) => {
    const db = drizzle(d1);
    const now = new Date().toISOString();
    const [result] = await db
      .insert(purchases)
      .values({
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        created_at: now,
        updated_at: now,
      })
      .returning();
    return result;
  },
};
