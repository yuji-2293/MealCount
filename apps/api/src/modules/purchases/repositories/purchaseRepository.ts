import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import type { CreatePurchaseData } from '../schemas/purchaseSchemas';
import { purchases } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { UpdatePurchaseData } from '../schemas/purchaseSchemas';
import { mealStockRepository } from '../../meal-stock/repositories/mealStockRepository';
export const purchaseRepository = {
  // 初回作成時にmealStockとpurchaseを同時に作成する処理
  firstCreateWithMealStock: async (data: CreatePurchaseData, d1: D1Database, userId: string) => {
    const db = drizzle(d1);
    const purchaseQuery = purchaseRepository.buildCreateQuery(db, data, userId);
    const mealStockQuery = mealStockRepository.buildFirstCreateQuery(
      db,
      userId,
      data.purchasedMealCount
    );

    const [mealStockRows, purchaseRows] = await db.batch([mealStockQuery, purchaseQuery]);

    if (mealStockRows.length === 0 || purchaseRows.length === 0) {
      throw new Error('Failed to create initial meal stock or purchase');
    }
    return {
      firstMealStock: mealStockRows[0],
      firstPurchase: purchaseRows[0],
    };
  },
  // mealStockを更新しつつpurchaseを作成する処理
  createWithMealStock: async (
    data: CreatePurchaseData,
    d1: D1Database,
    mealStockId: number,
    userId: string
  ) => {
    // 在庫を反映してmealStockを更新
    const db = drizzle(d1);
    const purchaseQuery = purchaseRepository.buildCreateQuery(db, data, userId);
    const mealStockQuery = mealStockRepository.buildAddPurchaseMealCountQuery(
      db,
      mealStockId,
      data.purchasedMealCount,
      userId
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
  buildCreateQuery: (db: ReturnType<typeof drizzle>, data: CreatePurchaseData, userId: string) => {
    const now = new Date().toISOString();
    const Id = userId;
    return db
      .insert(purchases)
      .values({
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        userId: Id,
        created_at: now,
        updated_at: now,
      })
      .returning();
  },

  findAll: async (d1: D1Database, userId: string) => {
    const db = drizzle(d1); // Local D1へのアクセス用
    const results = await db.select().from(purchases).where(eq(purchases.userId, userId));

    return results;
  },

  findById: async (id: number, d1: D1Database, userId: string) => {
    const db = drizzle(d1);
    const [result] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.id, id), eq(purchases.userId, userId)));
    return result;
  },

  update: async (
    id: number,
    data: UpdatePurchaseData,
    d1: D1Database,
    expectedVersion: number,
    userId: string
  ) => {
    // 更新後の在庫食数をbatchで更新
    const db = drizzle(d1);
    const [purchases] = await purchaseRepository.buildUpdateQuery(
      db,
      id,
      data,
      expectedVersion,
      userId
    );

    if (!purchases) {
      return { afterPurchase: null };
    }

    return {
      status: 'ok',
      afterPurchase: purchases,
    };
  },

  buildUpdateQuery: (
    db: ReturnType<typeof drizzle>,
    id: number,
    data: UpdatePurchaseData,
    expectedVersion: number,
    userId: string
  ) => {
    const now = new Date().toISOString();
    return db
      .update(purchases)
      .set({
        version: sql`${purchases.version} + 1`,
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        updated_at: now,
      })
      .where(
        and(
          eq(purchases.id, id),
          eq(purchases.version, expectedVersion),
          eq(purchases.userId, userId)
        )
      )
      .returning();
  },

  delete: async (id: number, d1: D1Database, expectedVersion: number, userId: string) => {
    const db = drizzle(d1);
    const [result] = await purchaseRepository.buildDeleteQuery(db, id, expectedVersion, userId);
    return result;
  },
  buildDeleteQuery: (
    db: ReturnType<typeof drizzle>,
    id: number,
    expectedVersion: number,
    userId: string
  ) => {
    return db
      .delete(purchases)
      .where(
        and(
          eq(purchases.id, id),
          eq(purchases.version, expectedVersion),
          eq(purchases.userId, userId)
        )
      )
      .returning();
  },
};
