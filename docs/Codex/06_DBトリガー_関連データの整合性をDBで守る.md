# DBトリガー: 関連データの整合性をDB自身に管理させる

## DBトリガーとは

DBトリガーは、INSERT・UPDATE・DELETEなどを契機に、DBが自動実行するSQLである。

MealCountでは、Purchaseの`purchased_meal_count`が変わったときに、対応する`meal_stock.current_meal_stock`を差分更新する目的で使われている。

## MealCountの実装

`apps/api/drizzle/0010_UpdateTrriger_Re.sql`では、Purchaseの食数更新を契機にトリガーを定義している。

```sql
CREATE TRIGGER purchase_meal_count_updated
AFTER UPDATE OF purchased_meal_count ON purchases
FOR EACH ROW
WHEN NEW.purchased_meal_count != OLD.purchased_meal_count
BEGIN
  SELECT RAISE(ABORT, '対応する在庫データが存在しません')
  WHERE NOT EXISTS (
    SELECT 1
    FROM meal_stock
    WHERE user_id = NEW.user_id
  );

  UPDATE meal_stock
  SET
    current_meal_stock = MAX(
      0,
      MAX(0, current_meal_stock - daily_meal_count * ...) +
      (NEW.purchased_meal_count - OLD.purchased_meal_count)
    ),
    last_calculated_date = date('now', '+9 hours')
  WHERE user_id = NEW.user_id;
END;
```

このトリガーは、RepositoryのPurchase更新クエリが成功した後にDB内で実行される。

```text
PATCH /purchases/:id
  → UPDATE purchases
  → purchased_meal_count が変わった場合
  → trigger が meal_stock を差分更新
```

## トリガーが守るルール

トリガーは次をDB自身に強制している。

1. 対応する`meal_stock`が存在しなければPurchaseの食数変更を中止する
2. 変更前後の食数差分を在庫へ反映する
3. 経過日数ぶんの消費を反映してから差分を加える
4. 在庫を0未満にしない

`RAISE(ABORT, ...)`を使う点が重要である。Serviceで例外を投げるだけでは、別のSQLクライアントや将来の別APIが直接Purchaseを更新した場合に同じルールを守れない。トリガーなら、DBに届いた更新経路を問わず適用される。

## どの操作に発火するか

このトリガーは次の場合だけ発火する。

```sql
AFTER UPDATE OF purchased_meal_count ON purchases
WHEN NEW.purchased_meal_count != OLD.purchased_meal_count
```

したがって、次の区別がある。

| 操作 | トリガー | 在庫反映の担当 |
| --- | --- | --- |
| Purchase作成 | 発火しない | `buildAddPurchaseMealCountQuery`のSQL式 |
| Purchase食数の更新 | 発火する | DBトリガー |
| Purchase金額・日付のみ更新 | 発火しない | 在庫更新不要 |
| Purchase削除 | 発火しない | Service / Repository側で別途必要 |

これは、作成・更新・削除で在庫整合性の実装箇所が異なることを意味する。

## 利点

- Purchase更新の経路を増やしても、食数変更に対する在庫反映を忘れにくい
- 参照整合性に関する不変条件を、データの近くに置ける
- `RAISE(ABORT)`により、不整合をSQLエラーにできる

## 注意点

### ルールが二重化しやすい

購入作成時の在庫式はRepositoryにあり、購入更新時の在庫式はトリガーSQLにある。どちらも「経過日数を引いてから食数を加減する」ルールを持つため、片方だけ修正すると挙動がずれる危険がある。

トリガーを採用する場合は、どのイベントをトリガーへ任せ、どのイベントをRepositoryのSQL式へ任せるかを文書化し、同じ境界条件をテストする必要がある。

### アプリケーションコードだけでは処理を追えない

`purchaseRepository.buildUpdateQuery`にはMealStockの更新が書かれていない。それでもPurchase食数を変更すると在庫が変わるのは、migration内のトリガーが動くためである。

コードレビューや障害調査では、TypeScriptだけでなく`apps/api/drizzle/`のmigrationも確認対象にする。

### トリガーは認可を補えない

トリガーは「Purchaseの食数と同一ユーザーの在庫を整合させる」ことはできる。しかし「このリクエストが本当にそのユーザーのものか」は判定できない。認可はRoute / 認証層で担当する。

## テストで確かめること

1. 食数を20から15へ変更すると、在庫が5減る
2. 食数を15から20へ変更すると、在庫が5増える
3. 食数以外だけを変更しても、在庫が変わらない
4. 対応するMealStockがない場合、Purchase更新も失敗する
5. 日付が変わった後の更新で、消費分と差分が正しい順序で反映される

DBトリガーは「便利な自動処理」ではなく、アプリ全体で守るべき不変条件をDBに置く選択である。採用したなら、migrationをアプリケーションコードと同じ重要度でレビュー・テストする。
