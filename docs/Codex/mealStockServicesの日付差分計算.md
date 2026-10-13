# `mealStockServices` における日付差分計算

## 対象と目的

対象: `apps/api/src/modules/meal-stock/services/mealStockServices.ts`

`GET /meal-stock/:id` のServiceは、DBに保存した `last_calculated_date` と現在時刻の差から、在庫計算のための経過日数 `elapsedDays` を求めている。

```ts
const now = new Date();
const lastCalculatedDate = data.last_calculated_date;
const elapsedDays = Math.floor(
  (now.getTime() - new Date(lastCalculatedDate).getTime()) / (1000 * 60 * 60 * 24)
);
```

このServiceが現在返すのは、DBから取得したMealStockの値に `elapsedDays` を追加したオブジェクトである。

```ts
return {
  ...data,
  elapsedDays,
};
```

現時点では、`current_meal_stock` を減算した在庫数はこのService内では計算していない。

## 値が届くまでの流れ

```text
GET /meal-stock/:id
  ↓ Route: `id` を文字列で取得して Number(id) に変換
mealStockServices.getMealStockById(d1, id)
  ↓
mealStockRepository.findById(d1, id)
  ↓
meal_stock.last_calculated_date を含むDBレコード
  ↓
現在時刻との差から elapsedDays を計算
  ↓
DBレコード + elapsedDays をJSONとして返す
```

責務は次のように分かれる。

| 層 | 担当 |
| --- | --- |
| Route | URLパラメータを読み、Serviceを呼び、JSONレスポンスにする |
| Repository | `meal_stock` テーブルから指定IDのレコードを取得する |
| Service | レコードの存在確認と、現在時刻を使う経過日数の計算 |

## 計算式を分解する

```ts
(now.getTime() - new Date(lastCalculatedDate).getTime())
```

`Date#getTime()` は `1970-01-01T00:00:00.000Z` からのミリ秒を返す。引き算の結果は、最後の計算日時から現在までに経過したミリ秒である。

```text
1日 = 1,000 ms × 60 秒 × 60 分 × 24 時間
     = 86,400,000 ms
```

そのため、式全体は次を表す。

```text
elapsedDays = floor((現在時刻 - last_calculated_date) / 86,400,000)
```

`Math.floor` は小数を切り捨てる。

| 経過時間 | 割り算の結果 | `elapsedDays` |
| --- | ---: | ---: |
| 0時間 | 0 | 0 |
| 23時間59分 | 0.999... | 0 |
| 24時間 | 1 | 1 |
| 47時間59分 | 1.999... | 1 |
| 48時間 | 2 | 2 |

したがって、このロジックは「日付が何回変わったか」ではなく、「24時間が何回完了したか」を数える。

## 具体例

`last_calculated_date` が `2026-10-10T09:00:00+09:00` のとき、次のようになる。

| 現在時刻 | 経過時間 | `elapsedDays` |
| --- | ---: | ---: |
| 2026-10-10 20:00 JST | 11時間 | 0 |
| 2026-10-11 08:59 JST | 23時間59分 | 0 |
| 2026-10-11 09:00 JST | 24時間 | 1 |
| 2026-10-12 09:00 JST | 48時間 | 2 |

この例では、日付が10月11日に変わっていても、10月11日09:00までは `elapsedDays` は `0` のままである。

## MealStockの設計メモとの関係

`docs/Hono-backend設計/mealstock/mealstock-flow.md` の設計では、経過日数を使って表示在庫を次のように求める。

```text
displayedCurrentMealStock
= currentMealStock - dailyMealCount × elapsedDays
```

現在の `mealStockServices.ts` が実装している範囲は、上式の `elapsedDays` を導出する部分である。

```text
DBの基準在庫・1日の消費食数・最終計算日
  ↓
Serviceが elapsedDays を計算       ← 現在ここまで実装済み
  ↓
currentMealStock - dailyMealCount × elapsedDays
  ↓
画面に表示する在庫数
```

つまり、`elapsedDays` は在庫を直接表す値ではなく、「基準在庫から何日分を差し引くか」を決めるための中間値である。

## 日付として数えたい場合の注意点

設計上の説明では「現在日 - lastCalculatedDate」と書かれているが、現在のコードは時刻を含む差分を24時間単位で切り捨てている。両者は同じ意味ではない。

| 求めたいもの | 現在の実装との一致 |
| --- | --- |
| 最終計算時刻から完了した24時間の数 | 一致する |
| カレンダー上で日付が変わった回数 | 一致しない場合がある |
| JSTの午前0時をまたいだ日数 | 一致しない場合がある |

また、`last_calculated_date` が `YYYY-MM-DD` の日付だけの文字列の場合、JavaScriptの解釈はUTC基準になる。そのため、実行環境のタイムゾーンによっては意図した「その地域の午前0時」と差が出る可能性がある。

日単位の在庫消費を「毎日0時に1日分」と定義するなら、今後は次を決める必要がある。

1. 基準タイムゾーン（例: `Asia/Tokyo`）
2. `last_calculated_date` に時刻・タイムゾーンを保存するか、日付だけを保存するか
3. 経過日数を「24時間単位」と「カレンダー日付の差」のどちらで扱うか

この定義が固まると、`elapsedDays` の計算式と設計メモの「現在日」の意味が一致する。

## エラー時の挙動

Repositoryが指定IDのレコードを返さない場合、Serviceは次のエラーを投げる。

```ts
throw new Error(`Meal stock with id ${id} not found`);
```

Routeには現時点でこのエラーをHTTPレスポンスへ変換する処理がない。そのため、日付計算が実行されるのは、対象のMealStockレコードを取得できた場合だけである。
