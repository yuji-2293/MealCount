import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import { mealStock } from '../../../db/schema';
import { eq } from 'drizzle-orm';

// mealStockを更新する際に使用する型
type MealStockUpdateValues = {
  currentMealStock: number;
  lastCalculatedDate: string;
};

export const mealStockRepository = {
  findById: async (d1: D1Database, id: number) => {
    const db = drizzle(d1);
    const [result] = await db.select().from(mealStock).where(eq(mealStock.id, id));
    return result;
  },
  // user_idをもとに紐づいているデータを取得する関数
  findByUserId: async (d1: D1Database, userId: number) => {
    const db = drizzle(d1);
    const [result] = await db.select().from(mealStock).where(eq(mealStock.user_id, userId));
    return result;
  },
  update: async (id: number, data: MealStockUpdateValues, d1: D1Database) => {
    const db = drizzle(d1);
    const [result] = await db
      .update(mealStock)
      .set({
        current_meal_stock: data.currentMealStock,
        last_calculated_date: data.lastCalculatedDate,
        updated_at: new Date().toISOString(),
      })
      .where(eq(mealStock.id, id))
      .returning();
    return result;
  },
  buildUpdateQuery: (db: ReturnType<typeof drizzle>, id: number, data: MealStockUpdateValues) => {
    return db
      .update(mealStock)
      .set({
        current_meal_stock: data.currentMealStock,
        last_calculated_date: data.lastCalculatedDate,
        updated_at: new Date().toISOString(),
      })
      .where(eq(mealStock.id, id))
      .returning();
  },
};
