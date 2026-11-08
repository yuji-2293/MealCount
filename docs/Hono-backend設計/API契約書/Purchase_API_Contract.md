# Purchase API 契約

対象実装: `apps/api/src/modules/purchases/routes/purchaseRoutes.ts`。ベースパスは `/purchases`。

## 共通の型とルール

### `Purchase`

```json
{
  "id": 1,
  "purchaseDate": "2026-11-08",
  "sameDayAmount": 500,
  "plannedAmount": 3000,
  "monthlyAmount": 1000,
  "purchasedMealCount": 20,
  "version": 0,
  "createdAt": "2026-11-08T00:00:00.000Z",
  "updatedAt": "2026-11-08T00:00:00.000Z"
}
```

### `Amounts`

```json
{
  "totalAmount": 4500,
  "totalRealAmount": 3500,
  "oneMealCost": 175
}
```

- `totalAmount` = `sameDayAmount + plannedAmount + monthlyAmount`
- `totalRealAmount` = `sameDayAmount + plannedAmount`
- `oneMealCost` = `totalRealAmount / purchasedMealCount`

`version` は楽観的ロック用の整数である。更新・削除では、クライアントが取得済みの値を送る。更新に成功すると `version` は 1 増える。

バリデーションに失敗したときは、`@hono/zod-validator` の標準レスポンスとして `400 Bad Request` と次の形が返る（`error` は Zod のエラー情報）。

```json
{
  "success": false,
  "error": {}
}
```

## 作成

### `POST /purchases`

#### Request body

```json
{
  "purchasedMealCount": 20,
  "sameDayAmount": 500,
  "plannedAmount": 3000,
  "monthlyAmount": 1000,
  "purchaseDate": "2026-11-08",
  "userId": 1,
  "version": 0
}
```

| フィールド | 必須 | 型・制約 |
| --- | --- | --- |
| `purchasedMealCount` | はい | 1 以上の整数 |
| `sameDayAmount` | はい | 0 以上の整数 |
| `plannedAmount` | はい | 0 以上の整数 |
| `monthlyAmount` | はい | 0 以上の整数 |
| `purchaseDate` | はい | 文字列（現実装では日付形式の検証なし） |
| `userId` | はい | 1 以上の整数 |
| `version` | いいえ | 0 以上の整数。受け付けるが、作成時の保存値には利用されない |

#### Response: `201 Created`

```json
{
  "purchase": {
    "id": 1,
    "purchaseDate": "2026-11-08",
    "sameDayAmount": 500,
    "plannedAmount": 3000,
    "monthlyAmount": 1000,
    "purchasedMealCount": 20,
    "version": 0,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z"
  },
  "amounts": {
    "totalAmount": 4500,
    "totalRealAmount": 3500,
    "oneMealCost": 175
  },
  "mealStock": {
    "id": 1,
    "currentMealStock": 20,
    "lastCalculatedDate": "2026-11-08",
    "dailyMealCount": 3,
    "updatedAt": "2026-11-08T00:00:00.000Z"
  }
}
```

作成時には、同じ `userId` の MealStock へ購入食数を加算する。該当 MealStock が存在しない場合のアプリ固有のエラーレスポンスは、現時点では定義されていない。

## 一覧取得

### `GET /purchases`

#### Response: `200 OK`

```json
[
  {
    "purchase": {
      "id": 1,
      "purchaseDate": "2026-11-08",
      "sameDayAmount": 500,
      "plannedAmount": 3000,
      "monthlyAmount": 1000,
      "purchasedMealCount": 20,
      "version": 0,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:00:00.000Z"
    },
    "amounts": {
      "totalAmount": 4500,
      "totalRealAmount": 3500,
      "oneMealCost": 175
    }
  }
]
```

配列の並び順は実装で指定されていない。

## 詳細取得

### `GET /purchases/:id`

#### Response: `200 OK`

```json
{
  "purchase": {
    "id": 1,
    "purchaseDate": "2026-11-08",
    "sameDayAmount": 500,
    "plannedAmount": 3000,
    "monthlyAmount": 1000,
    "purchasedMealCount": 20,
    "version": 0,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z"
  },
  "amounts": {
    "totalAmount": 4500,
    "totalRealAmount": 3500,
    "oneMealCost": 175
  }
}
```

#### Error: `404 Not Found`

```json
{ "error": "Purchase not found" }
```

## 更新

### `PATCH /purchases/:id`

#### Request body

```json
{
  "plannedAmount": 3500,
  "version": 0
}
```

| フィールド | 必須 | 型・制約 |
| --- | --- | --- |
| `version` | はい | 0 以上の整数 |
| `purchasedMealCount` | いいえ | 1 以上の整数 |
| `sameDayAmount` | いいえ | 0 以上の整数 |
| `plannedAmount` | いいえ | 0 以上の整数 |
| `monthlyAmount` | いいえ | 0 以上の整数 |
| `purchaseDate` | いいえ | 文字列（現実装では日付形式の検証なし） |

部分更新である。`userId` と表にないフィールドは受け付けない。

#### Response: `200 OK`

```json
{
  "status": "ok",
  "afterPurchase": {
    "purchase": {
      "id": 1,
      "purchaseDate": "2026-11-08",
      "sameDayAmount": 500,
      "plannedAmount": 3500,
      "monthlyAmount": 1000,
      "purchasedMealCount": 20,
      "version": 1,
      "createdAt": "2026-11-08T00:00:00.000Z",
      "updatedAt": "2026-11-08T00:01:00.000Z"
    },
    "amounts": {
      "totalAmount": 5000,
      "totalRealAmount": 4000,
      "oneMealCost": 200
    }
  }
}
```

#### Errors

| Status | Body | 条件 |
| --- | --- | --- |
| `400 Bad Request` | Zod のバリデーションエラー | リクエストボディがスキーマに適合しない |
| `404 Not Found` | `{ "error": "Purchase not found" }` | Purchase が存在しない |
| `404 Not Found` | `{ "error": "Meal stock not found" }` | 対応する MealStock が存在しない |
| `409 Conflict` | `{ "error": "Purchase version conflict" }` | 指定した `version` が現在値と一致しない |

## 削除

### `DELETE /purchases/:id?version=:version`

`version` は必須のクエリパラメータである。文字列で受け取り、0 以上の整数に変換して検証する。

```http
DELETE /purchases/1?version=0
```

#### Response: `204 No Content`

レスポンスボディはない。

#### Errors

| Status | Body | 条件 |
| --- | --- | --- |
| `400 Bad Request` | Zod のバリデーションエラー | `version` が未指定、または 0 以上の整数に変換できない |
| `409 Conflict` | `{ "error": "Purchase version conflict" }` | 指定した `version` が現在値と一致しない |

存在しない Purchase の削除は、現実装では `404` を返す処理を持たず、例外になる。このため `404` の JSON 契約は存在しない。
