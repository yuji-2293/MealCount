# トランザクション: batchでまとめても更新0件は自動ロールバックされない

## 2つの異なる話

複数SQLをまとめるとき、次の2つを分けて考える必要がある。

1. SQL実行エラーが起きたら、すでに実行した変更も戻るか
2. SQLはエラーでなく成功したが、対象行が0件だったとき、全体を失敗にできるか

Cloudflare D1の`db.batch`は、複数ステートメントをまとめて実行するために使える。しかし、`UPDATE ... WHERE ...`が0件を更新してもSQLエラーではない。DBから見ると「条件に合う行がなかったため、正常に0行更新した」という成功結果である。

したがって、**batchに入れただけでは、更新0件を理由に自動ロールバックされない**。

## MealCountの購入作成

`purchaseRepository.createWithMealStock`は、在庫更新とPurchase作成をbatchにまとめている。

```ts
const purchaseQuery = purchaseRepository.buildCreateQuery(db, data);
const mealStockQuery = mealStockRepository.buildAddPurchaseMealCountQuery(
  db,
  mealStockId,
  data.purchasedMealCount
);

const [mealStockRows, purchaseRows] = await db.batch([mealStockQuery, purchaseQuery]);

if (mealStockRows.length === 0 || purchaseRows.length === 0) {
  throw new Error('Failed to update meal stock or create purchase');
}
```

この`if`は重要だが、batchの**後**に実行されるJavaScriptの判定である。

もし`mealStockQuery`が0件、`purchaseQuery`が1件だった場合、`throw`はHTTP処理を失敗にするが、PurchaseのINSERTは既にコミットされている可能性がある。`throw`自身は直前のbatchを巻き戻さない。

`createPurchase`はbatch前にMealStockの存在確認をしているため通常は発生しにくい。それでも、確認とbatchの間に別の処理が対象行を削除する競合は理論上あり得る。

## 削除処理でも同じことが起きる

`purchaseService.deletePurchase`も、Purchase削除と在庫更新をbatchにまとめている。

```ts
const [purchaseRows, mealStockRows] = await db.batch([purchaseQuery, mealStockQuery]);
if (purchaseRows.length === 0 || mealStockRows.length === 0) {
  throw new Error('Failed to delete purchase or update meal stock');
}
```

ここでも、削除は成功し在庫更新が0件、という結果を判定してから例外を投げても、削除だけを後からロールバックすることはできない。

さらに現時点では、呼び出している`mealStockRepository.buildUpdateQuery`がRepositoryに存在せず、API型チェックが通らない。まず実行可能な形に戻す必要がある。

## 「0件」を失敗として扱う設計

0件更新を整合性違反として扱いたいときは、SQL文自身を失敗させる仕組み、または条件を満たす変更だけが発生するような設計が必要になる。

代表的な考え方は次の通りである。

| 方法 | 0件の意味 |
| --- | --- |
| versionをWHERE条件に含める | 0件は競合として検出する。HTTPでは409を返す |
| DBトリガーで`RAISE(ABORT, ...)` | 不整合ならSQLエラーにし、トランザクション失敗にする |
| FK / CHECK / UNIQUE制約 | 不正な書込みそのものをSQLエラーにする |
| 事前SELECT + batch後の行数判定 | 業務エラーは検出できるが、判定時点では遅い場合がある |

## `batch`と楽観的ロックの関係

`UPDATE purchases ... WHERE id = ? AND version = ?`が0件になるのは、楽観的ロックでは通常の競合検出である。この0件を「トランザクション異常」と混同しない。

```text
更新0件
├─ 対象IDがない: 404 Not Found
├─ versionが古い: 409 Conflict
└─ 関連行がない: 設計上の整合性違反。DB制約やトリガーも検討
```

batchは「複数のDB操作を1つの単位で実行する」ための道具である。何を失敗とみなすか、0件時にどの状態を許すかは、Service・Repository・DB制約をまたいで明示的に設計する。
