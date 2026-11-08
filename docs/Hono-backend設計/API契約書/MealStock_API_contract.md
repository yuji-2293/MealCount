# MealStock API 契約

対象実装: `apps/api/src/modules/meal-stock/routes/mealStockRoutes.ts`。ベースパスは `/meal-stock`。

`current_meal_stock` は DB に保存した基準在庫、`estimatedStock` は取得時点の推定在庫である。`estimatedStock` は `current_meal_stock - daily_meal_count × elapsedDays` を 0 未満にならないようにした値で、取得時に計算される。GET は DB カラム名の `snake_case` をそのまま返す点に注意する。

## 取得

### `GET /meal-stock/:id`

#### Response: `200 OK`

```json
{
  "id": 1,
  "daily_meal_count": 3,
  "current_meal_stock": 20,
  "last_calculated_date": "2026-11-08",
  "version": 0,
  "updated_at": "2026-11-08T00:00:00.000Z",
  "user_id": 1,
  "elapsedDays": 0,
  "estimatedStock": 20
}
```

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `id` | number | MealStock ID |
| `daily_meal_count` | number | 1 日の消費食数 |
| `current_meal_stock` | number | 最終計算日時点で保存した在庫食数 |
| `last_calculated_date` | string | 在庫を最後に確定した日 |
| `version` | number | 楽観的ロック用のバージョン |
| `updated_at` | string | 最終更新日時 |
| `user_id` | number | 所有ユーザー ID |
| `elapsedDays` | number | `last_calculated_date` からの経過日数 |
| `estimatedStock` | number | 経過消費を差し引いた推定在庫（0 以上） |

存在しない ID の場合、現実装は明示的な `404` レスポンスを返さず例外になる。そのため `404` の JSON 契約は存在しない。

## 更新

### `PATCH /meal-stock/:id`

#### Request body

```json
{
  "currentMealStock": 18,
  "version": 0
}
```

| フィールド | 必須 | 型・制約 |
| --- | --- | --- |
| `currentMealStock` | はい | 0 以上の整数 |
| `version` | はい | 0 以上の整数。現在の値と一致する必要がある |

更新時、サーバーは `last_calculated_date` を日本時間の当日に設定し、`version` を 1 増やす。`daily_meal_count` はこの API では更新できない。

#### Response: `200 OK`

```json
{
  "status": "ok",
  "afterMealStock": {
    "id": 1,
    "daily_meal_count": 3,
    "current_meal_stock": 18,
    "last_calculated_date": "2026-11-08",
    "version": 1,
    "updated_at": "2026-11-08T00:01:00.000Z",
    "user_id": 1
  }
}
```

#### Errors

| Status | Body | 条件 |
| --- | --- | --- |
| `400 Bad Request` | `{ "success": false, "error": {} }` | `currentMealStock` または `version` が欠ける、もしくはスキーマに適合しない |
| `404 Not Found` | `{ "error": "Meal stock not found" }` | 指定した MealStock が存在しない |
| `409 Conflict` | `{ "error": "Conflict: Failed to update meal stock" }` | 指定した `version` が現在値と一致しない |

`400` の `error` は Zod の詳細なエラー情報である。
