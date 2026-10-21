import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import { mealStock } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateMealStockData } from '../schemas/mealStockSchema';

export const mealStockRepository = {
  findById: async (d1: D1Database, id: number) => {
    const db = drizzle(d1);
    const [result] = await db.select().from(mealStock).where(eq(mealStock.id, id));
    return result;
  },
  update: async (id: number, data: UpdateMealStockData, d1: D1Database) => {
    const db = drizzle(d1);
    const now = new Date().toISOString();
    const [result] = await db
      .update(mealStock)
      .set({
        current_meal_stock: data.currentMealStock,
        last_calculated_date: now,
        updated_at: now,
      })
      .where(eq(mealStock.id, id))
      .returning();
    return result;
  },
};
