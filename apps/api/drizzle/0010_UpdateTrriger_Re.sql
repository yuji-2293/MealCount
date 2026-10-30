DROP TRIGGER IF EXISTS purchase_meal_count_updated;

-- Custom SQL migration file, put your code below! --
CREATE TRIGGER purchase_meal_count_updated
AFTER UPDATE OF purchased_meal_count ON purchases
FOR EACH ROW
WHEN NEW.purchased_meal_count != OLD.purchased_meal_count
BEGIN
-- 対応する在庫データが存在しなければ処理を中止
  SELECT RAISE(ABORT, '対応する在庫データが存在しません')
  WHERE NOT EXISTS (
    SELECT 1
    FROM meal_stock
    WHERE user_id = NEW.user_id
  );

  -- 対応する在庫データが存在する場合は、在庫の更新処理を行う
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
    )
          + (
        NEW.purchased_meal_count
        - OLD.purchased_meal_count
      )
  ),
    last_calculated_date = date('now', '+9 hours'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE user_id = NEW.user_id;
END;
