-- Custom SQL migration file, put your code below! --
CREATE TRIGGER purchase_meal_count_delete
AFTER DELETE ON purchases
FOR EACH ROW
BEGIN

SELECT RAISE(ABORT, '対応するデータが存在しません')
WHERE NOT EXISTS (SELECT 1 FROM meal_stock WHERE user_id = OLD.user_id);

-- 削除後に在庫を更新する
  UPDATE meal_stock
  SET
  current_meal_stock = MAX(
    0,
    MAX(
      0,
        current_meal_stock -  daily_meal_count * MAX(
          0,
         CAST(
          julianday(date('now', '+9 hours'))
         - julianday(last_calculated_date)
          AS INTEGER
          )
          )
    ) - OLD.purchased_meal_count
  ),
    last_calculated_date = date('now', '+9 hours'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE user_id = OLD.user_id;

END;
