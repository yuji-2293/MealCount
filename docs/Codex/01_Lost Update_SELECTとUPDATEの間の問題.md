# Lost Update: SELECTとUPDATEの間に別リクエストが入る問題

## Lost Updateとは

Lost Updateは、複数のリクエストが同じ値を読み取り、それぞれが計算結果を保存することで、**先に保存された更新が後の保存によって消える問題**である。

MealCountでは、特に`meal_stock.current_meal_stock`が対象になる。在庫は購入作成、購入削除、在庫補正で変わるため、同じユーザーに対する複数操作が重なる可能性がある。

## 問題になる処理の形

次の形が典型的なLost Updateである。

```text
1. SELECT current_meal_stock
2. アプリケーションで新しい在庫を計算
3. UPDATE meal_stock SET current_meal_stock = 計算結果
```

各ステップが別々のSQLとして実行されると、`SELECT`と`UPDATE`の間に他の更新が入れる。

## MealCountの削除処理で考える

`apps/api/src/modules/purchases/services/purchaseService.ts`の`deletePurchase`は、まず在庫を読み、JavaScriptで削除後の在庫を算出している。

```ts
const existingMealStock = await mealStockRepository.findByUserId(d1, userId);

const { estimatedStock } = calculateEstimatedStock(
  existingMealStock.last_calculated_date,
  existingMealStock.current_meal_stock,
  existingMealStock.daily_meal_count
);

const estimatedAfterMealStock = Math.max(0, estimatedStock - mealCount);
```

ここで算出した`estimatedAfterMealStock`を、後続のUPDATEで絶対値として保存する設計では、次の競合が起こる。

```text
初期在庫: 10

削除リクエスト A                         購入作成リクエスト B
────────────────────────────────────────────────────────
SELECT 在庫 10
削除後在庫を 7 と計算
                                      在庫に 5 食を加算
                                      DB在庫は 15 になる
UPDATE 在庫 = 7

最終在庫: 7
期待値: 12（10 - 3 + 5）
```

Bが加えた5食が、Aの`UPDATE ... = 7`により失われる。これがLost Updateである。

## 「SELECTがある」こと自体は問題ではない

`createPurchase`にも在庫を読む処理がある。

```ts
const existingData = await mealStockRepository.findByUserId(d1, data.userId);
const mealStockId = existingData.id;
```

これは`meal_stock`のIDを得るための読み取りであり、その読取値を使って在庫数を計算してはいない。後続の在庫加算はDB上の`current_meal_stock`を使うSQL式で実行される。

したがって重要なのは、SELECTの有無ではなく、**古い読取値を根拠にした絶対値UPDATEをするか**である。

## MealStockの手動補正にも同じ論点がある

`mealStockServices.updateMealStock`も、Serviceで推定在庫を計算してからRepositoryへ渡す。

```ts
const { estimatedStock } = calculateEstimatedStock(...);
const confirmedStock = data.currentMealStock ?? estimatedStock;

const result = await mealStockRepository.update(id, {
  currentMealStock: confirmedStock,
  lastCalculatedDate: getTodayJST(),
}, d1);
```

補正値を「利用者が意図して入力した絶対値」とするなら、上書き自体が業務上正しい場合もある。しかし、購入作成と同時に起きる場合にどちらを優先するかは、設計として明示する必要がある。

## 見分け方

次の質問に「はい」と答える場合、Lost Updateを疑う。

1. 同じ行を複数リクエストが更新しうるか
2. ServiceやControllerがDBから値を取得しているか
3. その値を使って新しい値を計算しているか
4. 計算値を`SET column = 値`として保存しているか
5. UPDATE条件にversionや更新日時を含めていないか

## 対処の選択肢

| 操作の性質 | 主な対処 |
| --- | --- |
| 加算・減算 | DB列を使った原子的な式更新 |
| 編集画面からの絶対値更新 | 楽観的ロック（version） |
| 複数行を必ず一緒に変更 | トランザクション / `batch` |
| 派生データを必ず追随 | DBトリガー、または一貫したService処理 |

MealCountでは「購入作成」は原子的更新、「Purchase編集」は楽観的ロック、「食数変更に伴う在庫差分」はトリガー、という方向性が既に見えている。今後は削除・在庫補正にも、同じ整合性方針を適用できるかを考える。
