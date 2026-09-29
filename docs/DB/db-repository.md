# DB Repository

## db取得
```ts
  create: async (data: CreatePurchaseData, d1: D1Database) => {
    const db = drizzle(d1); // Local D1へのアクセス用
    const now = new Date().toISOString(); // 現在日時をISO形式で取得

    const [result] = await db
      // 分割代入で挿入結果の最初のレコードを取得
      // [result] = ...でDBの挿入結果の最初のレコードを取得
      // [result] -> result には挿入後の最初のレコードが格納される
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
  ```

```ts
-- 短縮後のコード --
const [result] = await db...
return result;

-- 短縮前のコード --
> const results = await db...returning();
> const result = results[0];
> return result;

ES6のJavaScriptでは、配列の分割代入を使って挿入結果の最初のレコードを簡単に取得できる。
[]で囲ってるかどうかで、配列の分割代入を使うかどうかが決まる。
[]を外して、resultを返している部分がポイント
returning()した戻り値を配列の分割代入で取得して、最初のレコードをresultで受け取り、返すことができる。

```
