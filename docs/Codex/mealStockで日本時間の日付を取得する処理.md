# MealStockで日本時間の日付を取得する処理

## 結論

MealStockでは、`apps/api/src/utils/date.ts` の `getTodayJST` を使って、**`Asia/Tokyo` を基準にした今日の日付**を取得している。

```ts
export const getTodayJST = (): string => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};
```

この関数が返すのは時刻を含まない日付文字列である。

```text
2026-10-21
```

MealStockの経過日数計算では、この値を「今日」の基準日として使用する。

## 処理の流れ

```text
new Date()
  ↓ 現在の瞬間を表す Date オブジェクト
Intl.DateTimeFormat(..., { timeZone: 'Asia/Tokyo' })
  ↓ その瞬間を日本時間で見た年・月・日を取り出す
"2026-10-21"
  ↓
new Date(getTodayJST())
  ↓
MealStockの elapsedDays 計算に使う基準日
```

利用箇所は `apps/api/src/modules/meal-stock/services/mealStockServices.ts` である。

```ts
const now = new Date(getTodayJST());
const lastCalculatedDate = data.last_calculated_date;

const elapsedDays = Math.max(
  0,
  Math.floor((now.getTime() - new Date(lastCalculatedDate).getTime()) / (1000 * 60 * 60 * 24))
);
```

`elapsedDays`は、DBに保存された`last_calculated_date`から何日経過したかを表し、表示用の在庫数を求めるために使われる。

```ts
const currentMealStock = Math.max(
  0,
  data.current_meal_stock - data.daily_meal_count * elapsedDays
);
```

## `Intl.DateTimeFormat`の役割

`new Date()`はタイムゾーンに依存しない「ある瞬間」を表す。日本時間の日付として扱う部分は、`Intl.DateTimeFormat`の`timeZone: 'Asia/Tokyo'`で指定している。

```ts
new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
```

各指定の意味は次の通りである。

| 指定 | 役割 |
| --- | --- |
| `timeZone: 'Asia/Tokyo'` | 年・月・日を日本時間として取り出す |
| `year` / `month` / `day` | 時刻を除いた日付だけを出力する |
| `'sv-SE'` | `YYYY-MM-DD`に近い、年から始まる形式で出力するために使うロケール |

たとえば、現在の瞬間が次の場合を考える。

```text
UTC: 2026-10-20 15:30
JST: 2026-10-21 00:30
```

この瞬間に`getTodayJST()`を呼ぶと、UTCの日付ではなくJSTの日付を採用するため、結果は`"2026-10-21"`になる。

そのため、UTCではまだ前日であっても、日本時間で日付が変わった後ならMealStockは新しい日付として経過日数を計算できる。

## 「日本時間への変換」と`Date`の解釈は別の処理

次の2行は役割が異なる。

```ts
const todayJST = getTodayJST();      // "2026-10-21"
const now = new Date(todayJST);      // Date オブジェクトへ変換
```

1行目は`Asia/Tokyo`で見たカレンダー日を作る処理である。

一方、JavaScriptで`new Date('2026-10-21')`のように日付だけのISO形式文字列を渡すと、その値はUTCの午前0時として解釈される。

```text
new Date('2026-10-21')
→ 2026-10-21T00:00:00.000Z
→ JSTでは 2026-10-21 09:00:00
```

したがって、変数名は`now`であるが、ここで保持しているのはリクエスト時点の正確な現在時刻ではない。**JSTで求めた今日の日付を、比較可能な`Date`にした基準値**である。

## 日付だけで保存・比較する場合の意味

`last_calculated_date`も`YYYY-MM-DD`形式で保存されている場合、両方ともUTC午前0時として解釈される。

```text
last_calculated_date: "2026-10-20" → 2026-10-20T00:00:00.000Z
getTodayJST():        "2026-10-21" → 2026-10-21T00:00:00.000Z
差分: 24時間 → elapsedDays = 1
```

この比較では、実質的に「日本時間で見たカレンダー日が何日変わったか」を計算できる。`getTodayJST`と`last_calculated_date`の両方が同じ`YYYY-MM-DD`形式であることが前提である。

## データ形式をそろえる重要性

`last_calculated_date`は現在、DBでは`text`、Zodでは`z.string()`として定義されている。そのため、実装上は日付だけの文字列だけでなく、時刻とタイムゾーンを含む文字列も保存できる。

```ts
last_calculated_date: text('last_calculated_date').notNull()

export const mealStockSchema = z.object({
  lastCalculatedDate: z.string(),
});
```

次の形式を混在させると、比較の基準がそろわない。

```text
"2026-10-21"                // UTC午前0時として解釈される
"2026-10-21T00:00:00+09:00" // JST午前0時として解釈される
```

MealStockで日単位の消費を扱う現在の目的では、`last_calculated_date`を`YYYY-MM-DD`形式の「JSTのカレンダー日」として統一する、というデータ契約が重要になる。

## 責務の分担

| 層・関数 | 責務 |
| --- | --- |
| `getTodayJST` | 現在の瞬間から、日本時間における今日の日付文字列を作る |
| `mealStockServices.getMealStockById` | 今日と最終計算日の差から`elapsedDays`と表示用在庫数を計算する |
| `mealStockRepository` | `last_calculated_date`を含むMealStockレコードを読み書きする |

この分離により、タイムゾーンを意識する処理は`getTodayJST`に集約され、Serviceは「日付の差から在庫を計算する」ことに集中できる。
