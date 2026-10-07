# MealStock API Flow

## エンドポイント
GET /meal-stock
PATCH /meal-stock/:id

### API 詳細
- GET /meal-stock
  - 在庫情報を取得する
    - Purchaseのデータから取得する: purchasedMealCount
    - 1日の消費食数を取得する = dailyMealCount(デフォルトで3[=1日3食計算])
    - MealStockのデータから取得する: currentMealStock
      - 現在の在庫食数を取得する = currentMealStock
        -  現在の在庫食数 = (1~10日間のpurchasedMealCountの合計 - 1~10日間の消費食数の合計 )
  -  

- PATCH /meal-stock/:id
  - 1日の消費食数を更新する
    - 1日のデフォルト消費食数 = dailyMealCount(デフォルトで3[=1日3食計算])の変更
    - 更新後の在庫食数を計算する = currentMealStock
    - 更新後の在庫情報を返す
  - 

### 保持するデータ
