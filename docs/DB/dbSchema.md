# DB設計
## DBの責務
- データの永続化
- データの整合性維持
  - 整数は許可されるが、負の値は許可されない
  - 少数は許可されない
- クエリの最適化
- スキーマの管理
## テーブル一覧

### Purchases

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| id       | INTEGER  | PRIMARY KEY | 購入ID |
| purchase_date | DATE | NOT NULL | 購入日 |
| same_day_amount | INTEGER |CHECK (0 <= same_day_amount) NOT NULL | 即日購入金額 |
| planned_amount | INTEGER |CHECK (0 <= planned_amount) NOT NULL | 計画購入金額 |
| monthly_amount | INTEGER |CHECK (0 <= monthly_amount) NOT NULL | 各月購入金額 |
| purchased_meal_count | INTEGER |CHECK (0 < purchased_meal_count) NOT NULL | 仕入れ食数 |
| created_at | DATETIME | NOT NULL | 作成日時 |
| updated_at | DATETIME | NOT NULL | 更新日時 |
