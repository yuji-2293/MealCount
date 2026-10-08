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
        -  現在の在庫食数 = (1~10日間のpurchasedMealCountの合計 - 1~10日間の消費食数の合計 )

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
