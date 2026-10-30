# Atomic Update: DBの最新値を使って計算と保存を一体化する

## Atomic Updateとは

Atomic Updateは、アプリケーションが読み取った古い値ではなく、**UPDATEを実行した瞬間のDB行の値**を使って計算し、1つのSQL文で保存する方法である。

「原子的（atomic）」とは、この更新式が他のリクエストから途中状態として見えないことを指す。取得、JavaScript計算、保存を別々に行うより、Lost Updateを避けやすい。

## MealCountで既に使われているAtomic Update

`apps/api/src/modules/meal-stock/repositories/mealStockRepository.ts`の`buildAddPurchaseMealCountQuery`が該当する。

```ts
const elapsedDays = sql`
  MAX(0, CAST(julianday(${today}) - julianday(${mealStock.last_calculated_date}) AS INTEGER))
`;

const differenceStock = sql`
  MAX(0, ${mealStock.current_meal_stock}
    - ${mealStock.daily_meal_count} * ${elapsedDays})
  + ${purchasedMealCount}
`;

return db
  .update(mealStock)
  .set({
    current_meal_stock: sql<number>`${differenceStock}`,
    last_calculated_date: today,
    updated_at: new Date().toISOString(),
  })
  .where(eq(mealStock.id, id))
  .returning();
```

ポイントは、`mealStock.current_meal_stock`がJavaScriptの変数ではなく、SQL式の中のDBカラムであることだ。

```text
current_meal_stock = DBに今ある在庫
                     - DBに今ある1日消費食数 × 経過日数
                     + 今回仕入れた食数
```

## 同時購入作成でも値が失われにくい理由

初期在庫が10で、購入Aが5食、購入Bが3食を同時に作成する場合を考える。

```text
購入A: UPDATE ... SET current_meal_stock = current_meal_stock + 5
購入B: UPDATE ... SET current_meal_stock = current_meal_stock + 3
```

DBは各UPDATEを順に実行する。どちらが先でも、後のUPDATEは先の結果を現在値として利用するため、最終値は18になる。

これに対して、両方がアプリケーションで「10」を読んでから、片方が15、もう片方が13を絶対値として保存すると、最終値は15または13になり、更新が失われる。

## ここでの「最新値」は何か

Atomic Updateが保証するのは、SQL文が実行される時点の行の値を使うことである。HTTPリクエストを受けた時点の値や、Serviceが先にSELECTした時点の値ではない。

MealCountの式には、日数経過による消費も含まれる。

```ts
MAX(0, current_meal_stock - daily_meal_count * elapsedDays)
```

これにより、購入を記録する瞬間に、最後の計算日から今日までの消費を反映してから食数を加算する。

## Atomic Updateが適する操作

| 操作 | 例 | 向く理由 |
| --- | --- | --- |
| 増減 | 在庫に購入食数を足す | 現在値に対する差分で表せる |
| カウンタ | 閲覧数を1増やす | `count = count + 1`で表せる |
| 下限付き減算 | 在庫から食数を引く | `MAX(0, stock - n)`で表せる |

## Atomic Updateだけでは解決しない操作

「フォームで編集した値をそのまま保存する」操作は、差分ではなく絶対値の更新である。その場合、ユーザーが古い画面を開いたまま編集すると、別の編集を上書きしうる。

この問題には、`purchases.version`のような楽観的ロックが向く。Atomic Updateと楽観的ロックは競合する方法ではなく、更新の性質に応じて使い分ける。

## 現実装で確認する点

購入作成はAtomic Updateを使えている。一方、削除処理はServiceで`estimatedAfterMealStock`を計算し、絶対値更新をしようとしている。削除も差分操作として表せるなら、DB列を使った式に寄せることでLost Updateの範囲を減らせる。

重要なのは「Repositoryに書けばAtomicになる」のではなく、**SQLの右辺が定数・古いアプリ値ではなく、対象行のカラムを参照していること**である。
