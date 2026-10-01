import { sql } from 'drizzle-orm';
import { check, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const purchases = sqliteTable(
  'purchases',
  {
    id: integer('id').primaryKey(),
    purchase_date: text('purchase_date').notNull(),
    same_day_amount: integer('same_day_amount').notNull(),
    planned_amount: integer('planned_amount').notNull(),
    monthly_amount: integer('monthly_amount').notNull(),
    purchased_meal_count: integer('purchased_meal_count').notNull(),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => [
    check(
      'amount_nonnegative_check',
      sql`${table.same_day_amount} >= 0 AND ${table.planned_amount} >= 0 AND ${table.monthly_amount} >= 0`
    ),
    check('meal_count_positive_check', sql`${table.purchased_meal_count} > 0`),
  ]
);
