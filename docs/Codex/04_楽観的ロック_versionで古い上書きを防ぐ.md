# 楽観的ロック: versionで古い情報による上書きを防ぐ

## 楽観的ロックとは

楽観的ロックは、編集中に他者の更新が起こる頻度は高くないと考え、**保存する瞬間にだけ競合を検出する**方法である。

行に`version`を持たせ、画面が読み込んだversionとDBの現在versionが同じ場合だけ更新する。更新が成功したらversionを1増やす。

## MealCountにある実装

`apps/api/src/db/schema.ts`の`purchases`にはversion列がある。

```ts
version: integer('version').notNull().default(0),
```

更新用schemaでもversionを必須にしている。

```ts
export const updatePurchaseSchema = purchaseSchema
  .partial()
  .omit({ userId: true })
  .required({ version: true })
  .strict();
```

そして、`apps/api/src/modules/purchases/repositories/purchaseRepository.ts`の更新クエリは、`id`だけでなくversionも条件にしている。

```ts
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
  .where(and(eq(purchases.id, id), eq(purchases.version, expectedVersion)))
  .returning();
```

## 競合時の流れ

Purchase `id = 10`、`version = 3`を2人が編集したケースを考える。

```text
編集者A: version=3 を読取                 編集者B: version=3 を読取
────────────────────────────────────────────────────────────
UPDATE ... WHERE id=10 AND version=3
成功: 内容を更新し version=4
                                      UPDATE ... WHERE id=10 AND version=3
                                      更新0件: DBは既にversion=4
```

後から保存したBは、Aの変更を無言で上書きできない。Bは最新データを再取得し、変更を確認してからやり直す必要がある。

## `version`が防ぐもの、防がないもの

| 防ぐもの | 防がないもの |
| --- | --- |
| 古い編集画面からの全項目上書き | 在庫に対する加算・減算のLost Update |
| 同じPurchaseの編集競合 | 認可されていない他ユーザーの更新 |
| 更新途中で別編集が入ったことの見落とし | 2行以上を一緒に変える原子性 |

在庫を「5食増やす」処理ならAtomic Updateが向く。Purchaseを「画面にある値へ編集する」処理なら楽観的ロックが向く。役割が異なる。

## 現状で未接続の部分

RepositoryのCAS（Compare And Swap）更新は実装されているが、画面までの経路は完成していない。

`purchaseService.getAllPurchases`が一覧用に返す`purchase`には`version`が含まれない。

```ts
purchase: {
  id: data.id,
  purchaseDate: data.purchase_date,
  // version は返していない
}
```

Webの`PurchasesIndex.tsx`で送る更新JSONにもversionがない。

```ts
json: {
  plannedAmount,
  sameDayAmount,
  monthlyAmount,
  purchasedMealCount,
  purchaseDate,
},
```

そのため、schemaが要求する`version`をクライアントが送る一連の流れは、現時点では成立していない。

また、version不一致では`UPDATE ... RETURNING`が空配列になり、Repositoryは`Failed to update purchase`を投げる。これは「存在しないID」と「version競合」を区別していない。HTTP APIとしては、一般に競合を`409 Conflict`として扱い、利用者に再読込を促せるようにする。

## 完成形を考える順序

1. GETのPurchase表現に`version`を含める
2. 編集開始時にそのversionを状態として保持する
3. PATCH bodyにversionを含める
4. 更新0件の理由を、Not FoundとConflictに分ける
5. Conflict時に一覧・詳細を再取得して、利用者に再編集を選ばせる

ここで重要なのは、versionを「フロントエンドの都合の番号」ではなく、**読み取った状態が今も最新かをDBへ証明する値**として扱うことだ。
