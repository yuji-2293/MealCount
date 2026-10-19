import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';

import { mealStock } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const mealStockRepository = {
  findById: async (d1: D1Database, id: number) => {
    const db = drizzle(d1);
    const [result] = await db.select().from(mealStock).where(eq(mealStock.id, id));
    return result;
  },
};
