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
  - 
