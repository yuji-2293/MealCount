import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import { mealStock } from '../../../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getTodayJST } from '../../../utils/date';

// mealStockを更新する際に使用する型
type MealStockUpdateValues = {
  currentMealStock: number;
  lastCalculatedDate: string;
  version: number;
};

export const mealStockRepository = {
  findById: async (d1: D1Database, id: number) => {
    const db = drizzle(d1);
    const [result] = await db.select().from(mealStock).where(eq(mealStock.id, id));
    return result;
  },
  // user_idをもとに紐づいているデータを取得する関数
  findByUserId: async (d1: D1Database, userId: string) => {
    const db = drizzle(d1);
    const Id = String(userId);
    const [result] = await db.select().from(mealStock).where(eq(mealStock.userId, Id));
    return result;
  },
  update: async (id: number, data: MealStockUpdateValues, d1: D1Database) => {
    const db = drizzle(d1);
    const [result] = await mealStockRepository.buildUpdateQuery(db, id, data);
    if (!result) {
      return { afterMealStock: null };
    }
    return { status: 'ok' as const, afterMealStock: result };
  },
  buildUpdateQuery: (db: ReturnType<typeof drizzle>, id: number, data: MealStockUpdateValues) => {
    return db
      .update(mealStock)
      .set({
        version: sql<number>`${mealStock.version} + 1`,
        current_meal_stock: data.currentMealStock,
        last_calculated_date: data.lastCalculatedDate,
        updated_at: new Date().toISOString(),
      })
      .where(and(eq(mealStock.id, id), eq(mealStock.version, data.version)))
      .returning();
  },
  buildAddPurchaseMealCountQuery: (
    db: ReturnType<typeof drizzle>,
    id: number,
    purchasedMealCount: number
  ) => {
    const today = getTodayJST();
    const elapsedDays = sql`MAX(0, CAST(julianday(${today}) - julianday(${mealStock.last_calculated_date}) AS INTEGER))`;
    const differenceStock = sql`
      MAX(0, ${mealStock.current_meal_stock} - ${mealStock.daily_meal_count} * ${elapsedDays}) + ${purchasedMealCount}
    `;

    return db
      .update(mealStock)
      .set({
        current_meal_stock: sql<number>`${differenceStock}`,
        last_calculated_date: today,
        version: sql<number>`${mealStock.version} + 1`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(mealStock.id, id))

      .returning();
  },
};
