# MealStock API Flow

## エンドポイント
GET /meal-stock
PATCH /meal-stock/:id

### API 詳細
- GET /meal-stock
  - 在庫情報を取得する
    - 1日の消費食数を取得する = dailyMealCount(デフォルトで3[=1日3食計算])
    - MealStockのデータから取得する: currentMealStock
      - 現在の在庫食数を取得する = currentMealStock
        -  現在の在庫食数 

### 保持するデータ名と役割
  - id: 在庫情報の一意な識別子: number
  - dailyMealCount: 1日の消費食数を返す: number
  - currentMealStock: 現在の在庫食数を返す: number
  - lastCalculatedAt: 最後に在庫食数を計算した日時: string
  - updatedAt: 更新日時: string

- PATCH /meal-stock/:id
  - 1日の消費食数を更新する
    - 1日のデフォルト消費食数 = dailyMealCount(デフォルトで3[=1日3食計算])の変更
    - 更新後の在庫食数を計算する = currentMealStock
    - 更新後の在庫情報を返す

### 保持するデータ名と役割
  - dailyMealCount: 1日の消費食数を変更する,更新後のcurrentMealStockも再計算して返す: number
  - currentMealStock: 現在の在庫食数を再計算して返す: number
  - updatedAt: 更新日時: string

### 業務ロジック
currentMealStockの算出方法(保持するでなく、派生値としてGET時に計算して返す)
  = purchasedMealCount(Purchase) の累計 - (dailyMealCount × 経過日数)

[重要]
- currentMealStockは保持せず、GET時に計算して返すこと
- 算出する起算日はいつかを明確にすること (例: 最後に在庫食数を計算した日時 = lastCalculatedAt)

# MealStock 設計メモ

## 目的

MealStockは、現在の在庫食数と1日の消費食数を管理する。

在庫は毎日自動で消費される前提とし、ユーザーは必要に応じて実在庫を手動補正する。

---

## 保持するデータ

```ts
MealStock {
  id: number
  dailyMealCount: number
  currentMealStock: number
  lastCalculatedAt: string
  updatedAt: string
}
```

### 各項目の役割

- `id`
  - 在庫情報の一意な識別子

- `dailyMealCount`
  - 1日の消費食数
  - デフォルト値は `3`

- `currentMealStock`
  - 在庫計算の基準となる現在食数
  - Purchase登録時に `purchasedMealCount` 分だけ加算される
  - ユーザーによる手動補正時に更新される

- `lastCalculatedAt`
  - `currentMealStock` が最後に確定した日
  - 日次消費の計算起点として使用する

- `updatedAt`
  - MealStock自体の更新日時

---

## Purchase登録時

Purchaseが登録された場合、

```text
currentMealStock += purchasedMealCount
```

とする。

このとき `lastCalculatedAt` は変更しない。

例:

```text
currentMealStock = 20
purchasedMealCount = 5

↓ Purchase登録

currentMealStock = 25
```

---

## GET /meal-stock

GET時には、DBに保存されている `currentMealStock` をそのまま返さず、経過日数分の消費を計算する。

```text
elapsedDays
= 現在日 - lastCalculatedAt
```

```text
displayedCurrentMealStock
= currentMealStock
  - dailyMealCount * elapsedDays
```

例:

```text
currentMealStock = 20
dailyMealCount = 3
lastCalculatedAt = 10/7
現在日 = 10/9

elapsedDays = 2

20 - (3 * 2)
= 14
```

GETでは `14` を現在の在庫食数として返す。

GET時点ではDBの `currentMealStock` は更新しない。

---

## PATCH /meal-stock

ユーザーが冷蔵庫を確認し、表示された在庫数と実在庫に差がある場合に手動補正する。

例:

```text
GETで表示された在庫
14

実際の在庫
15
```

ユーザーが `15` に変更した場合、

```text
currentMealStock = 15
lastCalculatedAt = 現在日
```

として保存する。

これにより、その日以降の消費計算は新しい在庫数を基準に行う。

---

## 再計算の考え方

別途 `isCalculated` のようなフラグは持たない。

`lastCalculatedAt` が、

```text
どの日付時点まで在庫数が確定しているか
```

を表す。

そのため、同じ日に再度GETしても、

```text
elapsedDays = 0
```

となり、二重で消費されることはない。

---

## MealStockの基本思想

```text
Purchase
→ 在庫を増やすイベント

日付経過
→ 在庫を減らす要因

MealStock
→ 現在状態

ユーザー補正
→ 現在状態の基準点を更新
```

MealStockでは、日々の消費を都度DBへ書き込まず、GET時に現在値を計算する。

ユーザーが実在庫を確認して補正したタイミングで、

```text
currentMealStock
lastCalculatedAt
```

を更新し、新しい基準点とする。
