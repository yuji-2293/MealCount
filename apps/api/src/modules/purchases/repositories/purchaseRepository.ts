import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import type { CreatePurchaseData } from '../schemas/purchaseSchemas';
import { purchases } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import type { UpdatePurchaseData } from '../schemas/purchaseSchemas';
export const purchaseRepository = {
  create: async (data: CreatePurchaseData, d1: D1Database) => {
    const db = drizzle(d1); // Local D1へのアクセス用
    const query = purchaseRepository.buildCreateQuery(db, data);
    const [result] = await query;
    return result;
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

  update: async (id: number, data: UpdatePurchaseData, d1: D1Database) => {
    const db = drizzle(d1);
    const now = new Date().toISOString();
    const [result] = await db
      .update(purchases)
      .set({
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        updated_at: now,
      })
      .where(eq(purchases.id, id))
      .returning();
    return result;
  },
  buildUpdateQuery: (db: ReturnType<typeof drizzle>, id: number, data: UpdatePurchaseData) => {
    const now = new Date().toISOString();
    return db
      .update(purchases)
      .set({
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        updated_at: now,
      })
      .where(eq(purchases.id, id))
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
