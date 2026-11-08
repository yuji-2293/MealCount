# DBの整合性方針
本ドキュメントでは、MealCountにおけるDBの整合性を保つための方針について説明する。

## 施策
- 楽観的ロック：同一Purchaseの競合更新を検知する
  - 「競合した更新を検知して拒否する」
- Atomic Update：同一mealStockへの競合更新によるLost Updateを防ぐ
  - 「競合してもデータの加減算を成立させる」
- DBトリガー：Purchaseの変更を検知し、mealStockへの差分反映を実行する
- Transaction：PurchaseとmealStockの変更を一体として確定・ロールバックする
  
## 方針
- purchase情報の作成・更新・削除に伴うmealStockの整合性を保つための方針
POST：
新規購入の食数は既に分かっているため、RepositoryでPurchase保存とmealStockのAtomic UpdateをD1 batch() で実行する。
PATCH：
更新前後の食数差分が必要なため、DBトリガーのOLD / NEWを利用する。Purchase自体は楽観的ロックで競合を検知する。
DELETE：削除前の食数をOLDから取得し、DBトリガーでmealStockから減算する。
