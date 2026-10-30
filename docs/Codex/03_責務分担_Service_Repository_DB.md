# 責務分担: Service、Repository、DBは何を担当するか

## 結論

Service、Repository、DBの分割は、ファイルを3つに増やすことが目的ではない。**業務ルール、SQLの詳細、最終的なデータ整合性を別の場所で考えられるようにすること**が目的である。

MealCountでは、次の分担を基準に考えると理解しやすい。

| 層 | 主な責務 | MealCountの例 |
| --- | --- | --- |
| Route | HTTP入出力 | JSON検証、status code、Service呼び出し |
| Service | 業務ルールと処理の組立て | 金額計算、在庫更新が必要かの判断 |
| Repository | DB操作の詳細 | `SELECT`、`UPDATE`、SQL式、`returning()` |
| DB | 破ってはいけない事実 | NOT NULL、CHECK、FK、UNIQUE、トリガー |

## Routeの責務

`apps/api/src/modules/purchases/routes/purchaseRoutes.ts`のRouteは、HTTPの境界を扱う。

```ts
.patch('/:id', zValidator('json', updatePurchaseSchema), async (c) => {
  const d1 = c.env.meal_count_db;
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const result = await purchaseService.updatePurchase(Number(id), data, d1);
  return c.json(result, 200);
})
```

Routeが知るべきなのは、URL、HTTP method、body、status codeである。金額式や在庫の更新式をRouteに書くと、HTTP処理と業務ルールが混ざる。

## Serviceの責務

`apps/api/src/modules/purchases/services/purchaseService.ts`では、購入金額の意味を計算している。

```ts
const totalAmount = data.sameDayAmount + data.plannedAmount + data.monthlyAmount;
const totalRealAmount = data.sameDayAmount + data.plannedAmount;
const oneMealCost = totalRealAmount / data.purchasedMealCount;
```

これはMealCount固有の業務ルールなのでServiceに置くのが自然である。

また、購入作成で「MealStockが先に存在する必要がある」と判断しているのもServiceである。

```ts
const existingData = await mealStockRepository.findByUserId(d1, data.userId);
if (!existingData) {
  throw new Error(`Meal stock for user id ${data.userId} not found`);
}
```

Serviceは「何を一緒に実行するか」を決める。ただし、`UPDATE`の具体的なSQL式はRepositoryへ委ねる。

## Repositoryの責務

`apps/api/src/modules/meal-stock/repositories/mealStockRepository.ts`は、D1 / Drizzleを使った永続化を担当する。

```ts
return db
  .update(mealStock)
  .set({
    current_meal_stock: sql<number>`${differenceStock}`,
    last_calculated_date: today,
  })
  .where(eq(mealStock.id, id))
  .returning();
```

ここには「どのテーブルを、どの条件で、どのSQL式で更新するか」がある。HTTP ContextやHTTP responseはRepositoryに渡さない。

`purchaseRepository.createWithMealStock`は、PurchaseのINSERTとMealStockのUPDATEを`db.batch`にまとめる。複数の永続化操作をどう発行するかもRepositoryの関心である。

## DBの責務

DBは、どの呼び出し元から更新されても守られるべき不変条件を担当する。

```ts
check('meal_count_positive_check', sql`${table.purchased_meal_count} > 0`),
check('current_meal_stock_nonnegative', sql`${table.current_meal_stock} >= 0`),
```

さらに、購入食数変更時に在庫を更新するトリガーもDB側の仕組みである。

DB制約はServiceのバリデーションの代替ではない。Route / Zodは利用者へ分かりやすい入力エラーを返すため、DB制約はバグや別経路のSQLからデータを守るために、両方必要になる。

## 現実装から学べる境界の曖昧さ

`purchaseService.deletePurchase`はService内で`drizzle(d1)`を呼び、Repositoryのクエリビルダーを組み立てている。

```ts
const db = drizzle(d1);
const purchaseQuery = purchaseRepository.buildDeleteQuery(db, id);
const mealStockQuery = mealStockRepository.buildUpdateQuery(db, ...);
const [purchaseRows, mealStockRows] = await db.batch([purchaseQuery, mealStockQuery]);
```

これは「削除と在庫更新を一緒にする」という業務上の判断と、「D1のbatchをどう呼ぶか」というDB詳細が同じ場所にある状態である。

学習段階では処理の流れを追いやすい利点がある。一方で複雑化したときは、batchを発行する処理をRepository側へ寄せるか、複数Repositoryをまたぐユースケース専用の永続化境界を設けるかを検討できる。

## 判断の目安

| 質問 | 置き場所の目安 |
| --- | --- |
| HTTP bodyはどの形か | Route / Schema |
| 実質食費はどう計算するか | Service |
| `current_meal_stock + n`をどうSQLで書くか | Repository |
| 在庫を負数にしてよいか | DBのCHECK制約 |
| Purchase変更時に必ず在庫を追随させるか | DBトリガー、または一貫したService設計 |

責務分担の良し悪しは、処理が一度で正しく動くかだけではなく、「同じルールを変更するとき、どこを確認すればよいか」が明確かで判断する。
