# MealStock DB Migration 手順

## 目的

既存の `purchases` テーブルが存在するローカルD1へ、Drizzleを使って `meal_stock` テーブルを追加する。

---

## 1. Drizzle schema に `meal_stock` を追加する

`apps/api/src/db/schema.ts` に `meal_stock` テーブル定義を追加する。

```ts
import { sql } from 'drizzle-orm';
import { check, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const mealStockTable = sqliteTable(
  'meal_stock',
  {
    id: integer('id').primaryKey(),
    daily_meal_count: integer('daily_meal_count').notNull().default(3),
    current_meal_stock: integer('current_meal_stock').notNull().default(0),
    last_calculated_at: text('last_calculated_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => [
    check('current_meal_stock_nonnegative', sql`${table.current_meal_stock} >= 0`),
    check('daily_meal_count_nonnegative', sql`${table.daily_meal_count} >= 0`),
  ]
);
```

`drizzle.config.ts` は以下のschemaを参照している。

```ts
schema: './src/db/schema.ts'
```

そのため、`schema.ts` に直接 `mealStockTable` を定義していればDrizzleから認識される。

---

## 2. migration SQL を生成する

`apps/api` へ移動する。

```bash
cd apps/api
```

Drizzle Kitで差分migrationを生成する。

```bash
pnpm drizzle-kit generate
```

生成後、`drizzle/` を確認する。

```bash
ls drizzle
```

例:

```text
0000_opposite_genesis.sql
0001_moaning_franklin_richards.sql
meta/
```

`0000` は既存のPurchaseテーブル用migration。

今回追加した `meal_stock` は、新しい `0001` migrationとして生成される。

---

## 3. 生成されたSQLを確認する

```bash
cat drizzle/0001_moaning_franklin_richards.sql
```

以下のような `CREATE TABLE` が含まれていることを確認する。

```sql
CREATE TABLE `meal_stock` ...
```

---

## 4. repository rootへ戻る

```bash
cd ../..
```

---

## 5. ローカルD1へmigrationを適用する

MealCountではWranglerの `migrations apply` ではなく、Drizzleが生成したSQLを `d1 execute --file` で直接適用する。

```bash
pnpm wrangler \
  --config apps/api/wrangler.jsonc \
  d1 execute meal-count-db \
  --local \
  --file=apps/api/drizzle/0001_moaning_franklin_richards.sql
```

成功例:

```text
Resource location: local

Executing on local database meal-count-db
1 command executed successfully.
```

---

## 6. テーブル作成を確認する

SQLiteのシステムテーブルから一覧を取得する。

```bash
pnpm wrangler \
  --config apps/api/wrangler.jsonc \
  d1 execute meal-count-db \
  --local \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
```

結果に以下が含まれていれば成功。

```text
purchases
meal_stock
```

---

## MealCountのmigration運用

現在のMealCountでは、

```text
Drizzle schema変更
↓
drizzle-kit generate
↓
新しい migration SQL を生成
↓
wrangler d1 execute --file
↓
D1へ適用
```

という流れを使用する。

Wranglerの

```bash
wrangler d1 migrations apply
```

はWrangler独自の `migrations/` ディレクトリを前提とするため、現在のDrizzleベースの運用とは混在させない。

---

## 注意点

既に適用済みのmigrationファイルは基本的に変更しない。

例:

```text
0000_opposite_genesis.sql
```

に `meal_stock` を後から追記するのではなく、

```text
0001_moaning_franklin_richards.sql
```

のように新しいmigrationとして追加する。

これにより、DB変更履歴を順番に追跡できる。

---

## 今回の結果

```text
purchases
→ 既存テーブル

meal_stock
→ 今回追加
```

ローカルD1への `meal_stock` テーブル追加まで完了。
