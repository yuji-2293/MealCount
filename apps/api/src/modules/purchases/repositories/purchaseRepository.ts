import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import type { CreatePurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";
import { purchases } from "@/db/schema";

export const purchaseRepository = {
  create: async (data: CreatePurchaseData, d1: D1Database) => {
    const db = drizzle(d1); // Local D1へのアクセス用
    const now = new Date().toISOString(); // 現在日時をISO形式で取得

    const [result] = await db
      .insert(purchases) // purchasesテーブルに対してINSERT操作を行う
      .values({
        purchased_meal_count: data.purchasedMealCount,
        same_day_amount: data.sameDayAmount,
        planned_amount: data.plannedAmount,
        monthly_amount: data.monthlyAmount,
        purchase_date: data.purchaseDate,
        created_at: now,
        updated_at: now,
      })
      .returning(); // 挿入後のレコードを取得
    return result;
  },
};
