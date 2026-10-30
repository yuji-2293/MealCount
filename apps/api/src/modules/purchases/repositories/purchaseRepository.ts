import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import type { CreatePurchaseData } from '../schemas/purchaseSchemas';
import { purchases } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { UpdatePurchaseData } from '../schemas/purchaseSchemas';
import { mealStockRepository } from '../../meal-stock/repositories/mealStockRepository';
export const purchaseRepository = {
  createWithMealStock: async (data: CreatePurchaseData, d1: D1Database, mealStockId: number) => {
    // 在庫を反映してmealStockを更新
    const db = drizzle(d1);
    const purchaseQuery = purchaseRepository.buildCreateQuery(db, data);
    const mealStockQuery = mealStockRepository.buildAddPurchaseMealCountQuery(
      db,
      mealStockId,
      data.purchasedMealCount
    );

    // cloudflare D1のbatchでmealStockとpurchaseを同時に作成と更新を行う
    const [mealStockRows, purchaseRows] = await db.batch([mealStockQuery, purchaseQuery]);

    if (mealStockRows.length === 0 || purchaseRows.length === 0) {
      throw new Error('Failed to update meal stock or create purchase');
    }
    return {
      mealStock: mealStockRows[0],
      purchase: purchaseRows[0],
    };
  },
  buildCreateQuery: (db: ReturnType<typeof drizzle>, data: CreatePurchaseData) => {
    const now = new Date().toISOString();
    return db
      .insert(purchases)
      .values({
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        user_id: data.userId,
        created_at: now,
        updated_at: now,
      })
      .returning();
  },

  findAll: async (d1: D1Database) => {
    const db = drizzle(d1); // Local D1へのアクセス用
    const results = await db.select().from(purchases);
    return results;
  },

  findById: async (id: number, d1: D1Database) => {
    const db = drizzle(d1);
    const [result] = await db.select().from(purchases).where(eq(purchases.id, id));
    return result;
  },

  updateWithMealStock: async (
    id: number,
    data: UpdatePurchaseData,
    d1: D1Database,
    expectedVersion: number
  ) => {
    // 更新後の在庫食数をbatchで更新
    const db = drizzle(d1);
    const [purchases] = await purchaseRepository.buildUpdateQuery(db, id, data, expectedVersion);

    if (!purchases) {
      throw new Error('Failed to update purchase');
    }

    return {
      afterPurchase: purchases,
    };
  },

  buildUpdateQuery: (
    db: ReturnType<typeof drizzle>,
    id: number,
    data: UpdatePurchaseData,
    expectedVersion: number
  ) => {
    const now = new Date().toISOString();
    return db
      .update(purchases)
      .set({
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        version: sql`${purchases.version} + 1`,
        updated_at: now,
      })
      .where(and(eq(purchases.id, id), eq(purchases.version, expectedVersion)))
      .returning();
  },

  delete: async (id: number, d1: D1Database) => {
    const db = drizzle(d1);
    const [result] = await db.delete(purchases).where(eq(purchases.id, id)).returning();
    return result;
  },
  buildDeleteQuery: (db: ReturnType<typeof drizzle>, id: number) => {
    return db.delete(purchases).where(eq(purchases.id, id)).returning();
  },
};
