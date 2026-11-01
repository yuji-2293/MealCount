# 2026-10-30: 楽観的ロックとPurchase API

## versionカラムの追加

`apps/api/drizzle/0008_lazy_krista_starr.sql`で、Purchaseにversionカラムが追加された。

```sql
ALTER TABLE `purchases` ADD `version` integer DEFAULT 0 NOT NULL;
```

versionは、画面やクライアントが読み取ったPurchaseが、現在のDB状態と同じ版かを確認するための値である。

## 更新時のCompare And Swap

`purchaseRepository.buildUpdateQuery`は、IDとversionの両方が一致する行だけを更新する。

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
  })
  .where(and(eq(purchases.id, id), eq(purchases.version, expectedVersion)))
  .returning();
```

これはCompare And Swap（CAS）である。

```text
期待version = 3
DBのversion = 3  → 更新成功、versionは4になる
DBのversion = 4  → 更新0件、古い編集として扱う
```

## DELETEにも同じ条件を使う

削除も古い画面から実行される可能性があるため、同じversion条件が使われる。

```ts
return db
  .delete(purchases)
  .where(and(eq(purchases.id, id), eq(purchases.version, expectedVersion)))
  .returning();
```

これにより、他のリクエストがPurchaseを更新した後に、古いversionを持つクライアントが削除することを防ぐ。

## HTTP入力の設計

削除ではbodyではなくquery parameterでversionを受け取る方針である。

```ts
export const deletePurchaseSchema = z.object({
  version: z.coerce.number().nonnegative().int(),
});
```

HTTP query parameterは文字列なので、`z.coerce.number()`が必要になる。`z.number()`だけでは`?version=1`の文字列を検証できない。

Routeでは、検証済みの値を取得してServiceへ渡す。

```ts
const { version } = c.req.valid('query');
const result = await purchaseService.deletePurchase(Number(id), Number(version), d1);

if (!result) {
  return c.json({ error: 'Purchase version conflict' }, 409);
}
```

## レスポンスにversionを含める理由

create、一覧、詳細、更新の各Serviceレスポンスに`version`が追加された。

```ts
purchase: {
  id: data.id,
  // ...
  version: data.version,
}
```

楽観的ロックは、クライアントが「読み取ったversion」を次のPATCHまたはDELETEへ返せなければ成立しない。versionをレスポンスに含めることは、DB実装とAPI契約を接続するための変更である。

## APIとして確認したい点

楽観的ロックでは、更新0件の理由を区別する必要がある。

```text
対象Purchaseが存在しない       → 404 Not Found
Purchaseはあるがversionが古い   → 409 Conflict
```

この日の実装ではDELETEのversion競合を409として表現する方向へ進んだ。今後は、更新APIも含めて例外を一貫してHTTPエラーへ変換し、競合時の再取得を利用者へ促せるようにする。
