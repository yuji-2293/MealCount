# MealCount の HTTP ステータスコード実装状況

## この文書の対象

2026-11-20 時点の `origin/main`（コミット `01a4442`）を対象に、API Route が返す HTTP ステータスコードと、Web 側がその結果をどう扱うかを整理する。

## 結論

現在の API は、MVP に必要な成功系（200 / 201 / 204）、認証失敗（401）、対象なし（404）、入力不正（主に Zod validator による 400）、競合（409）を持つ。特に **401 と 404 の意味は API 側で分離されている**。

一方、Web の Purchase API 関数は `response.ok` が false なら HTTP ステータスを保持せず一律の `Error` にしている。そのため、利用者には 401・404・409 の違いがまだ表示されない。API の契約としては妥当だが、画面 UX は次の段階である。

## 一覧

| ステータス | 現在の用途 | 実装箇所 | Web 側の現在の扱い |
| --- | --- | --- | --- |
| 200 OK | 購入一覧・購入1件取得・在庫取得・更新成功 | Purchase / MealStock Route | `res.json()` を返す |
| 201 Created | 購入作成成功 | `POST /purchases` | `res.json()` を返す |
| 204 No Content | 購入削除成功 | `DELETE /purchases/:id` | 成功として Response を返す |
| 400 Bad Request | validator の入力検証失敗、在庫 version 不在 | Zod validator、MealStock Route | `Error` に集約 |
| 401 Unauthorized | セッションがない・無効 | 認証 middleware | `Error` に集約 |
| 403 Forbidden | **未使用** | 該当なし | 該当なし |
| 404 Not Found | 自分が読めない Purchase / MealStock、関連在庫なし | Purchase / MealStock Route | `Error` に集約 |
| 409 Conflict | 楽観的ロックの version 不一致 | Purchase / MealStock Route | `Error` に集約 |
| 500 Internal Server Error | 明示的な統一実装なし。例外時は Hono / Workers の既定処理に委ねる | 該当なし | `Error` に集約 |

## 200 / 201 / 204: 成功時

### 200 OK

- `GET /purchases` は購入一覧を 200 で返す。[`purchaseRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/routes/purchaseRoutes.ts:16)
- `GET /purchases/:id` は自分の購入があれば 200。[`purchaseRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/routes/purchaseRoutes.ts:25)
- `GET /meal-stock/:id` は自分の在庫があれば、ステータスを省略した `c.json()`（Hono の既定で 200）。[`mealStockRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/meal-stock/routes/mealStockRoutes.ts:11)
- Purchase / MealStock の PATCH 成功時も `c.json()` で 200。

「取得・更新は成功し、レスポンス本文がある」ため、200 の選択は自然である。

### 201 Created

`POST /purchases` は購入が作成されるため 201 を返す。[`purchaseRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/routes/purchaseRoutes.ts:37)

購入が初回なら MealStock も同時に作成し、2回目以降は既存 MealStock を更新するが、クライアントが要求した主資源である Purchase はいずれも作成される。そのため 201 で一貫している。

### 204 No Content

`DELETE /purchases/:id` の成功は `c.body(null, 204)` で返す。[`purchaseRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/routes/purchaseRoutes.ts:71)

削除後に本文を返さない契約なので 204 と整合する。Web の `deletePurchase` も JSON を読まず Response を返すため、この仕様に合っている。

## 400: リクエストが API 契約を満たさない場合

Purchase は `@hono/zod-validator` を使い、JSON、path parameter、query parameter を検証する。

- `POST /purchases` は `purchasedMealCount` を正の整数、金額を 0 以上の整数として検証する。
- `PATCH /purchases/:id` は `version` を必須、他の更新項目を任意として検証する。
- `:id` と削除 query の `version` は HTTP 上の文字列を `z.coerce.number()` で数値に変換して検証する。

定義は [`apps/api/src/modules/purchases/schemas/purchaseSchemas.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/schemas/purchaseSchemas.ts:3)、Route での適用は [`purchaseRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/routes/purchaseRoutes.ts:25) 以降にある。Zod validator が拒否した場合、Route handler に入る前に 400 となる。

MealStock でも `currentMealStock >= 0` と `version >= 0` を schema で検証する。加えて Route には `version` がない場合の 400 分岐がある。[`mealStockRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/meal-stock/routes/mealStockRoutes.ts:22) ただし現在の `UpdateMealStockSchema` では `version` 自体が必須なので、通常は validator の 400 が先に成立し、この分岐は防御的な重複チェックである。

## 401: 未認証

[`authMiddleware.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/auth/middleware/authMiddleware.ts:8) は Cookie を含む request header からセッションを取得する。ユーザーが得られなければ、保護された Purchase / MealStock API は `{ error: '未認証' }` と 401 を返す。

401 は「認証情報がない、または有効ではない」ことを表す。対象のデータが自分のものでないことを表す 403 や 404 とは別である。

`/api/authorization/*` にも同等のセッション検査があるが、エラー本文は英語の `{ error: 'Unauthorized' }` である。ステータスは同じ 401 だが、エラー表現はまだ統一されていない。[`userRoutes.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/auth/routes/userRoutes.ts:12)

## 403: 現在は返さない

403 は「誰であるかは確認できたが、その操作は許可されない」を意味する。現在の MVP には admin などのロールや、共有リソースへの権限がないため、403 を使う場面は実装されていない。

所有者でない Purchase / MealStock ID へのアクセスは、Repository の `WHERE id = ? AND userId = ?` が行を返さず、**404** になる。この方針は「その ID のデータが存在するか」を他ユーザーに知らせないため、個人データ API では合理的である。

```text
未ログイン                   → 401
ログイン済み・自分のデータ   → 200 / 204
ログイン済み・他人の ID      → 404（存在を隠す）
ログイン済み・ロール不足     → 現在はロールがないため未実装。導入時は 403 の候補
```

## 404: 見つからない、または所有していない

以下は明示的に 404 を返す。

| エンドポイント | 条件 | レスポンス例 |
| --- | --- | --- |
| `GET /purchases/:id` | ID がない、または他ユーザーの購入 | `Purchase not found` |
| `PATCH /purchases/:id` | ID がない、または他ユーザーの購入 | `Purchase not found` |
| `DELETE /purchases/:id` | ID がない、または他ユーザーの購入 | `Purchase not found` |
| `PATCH /purchases/:id` | 自分の購入はあるが、紐づく MealStock がない | `Meal stock not found` |
| `GET /meal-stock/:id` | ID がない、または他ユーザーの在庫 | `Meal stock not found` |
| `PATCH /meal-stock/:id` | ID がない、または他ユーザーの在庫 | `Meal stock not found` |

Purchase の所有者条件は [`purchaseRepository.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/repositories/purchaseRepository.ts:82)、MealStock の条件は [`mealStockRepository.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/meal-stock/repositories/mealStockRepository.ts:15) を参照。

この 404 は存在しない場合と所有者でない場合を区別しない。画面にとってはどちらも「現在のログインユーザーは操作対象を取得できない」であり、セキュリティ面でも情報露出が少ない。

## 409: 楽観的ロックの競合

更新・削除には `version` を含める。Repository は `id`、`userId` に加えて `version` も WHERE 条件にする。

- Purchase PATCH / DELETE: `Purchase version conflict`
- MealStock PATCH: `Conflict: Failed to update meal stock`

これは「データはあるが、クライアントが読んだ後に別の更新が行われ、同じ version のままでは保存できない」状態であり、404 ではなく 409 が適切である。実装は [`purchaseRepository.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/repositories/purchaseRepository.ts:137) と [`mealStockRepository.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/meal-stock/repositories/mealStockRepository.ts:43) にある。

なお Purchase Service は先に所有者付きで存在確認を行うため、存在しない／他ユーザーの行は 404、存在した後に version が変化したケースは 409 と判別している。これは API 利用者に再読み込みすべき理由を伝えられる構造である。

## 500: 例外時の扱い

Purchase の初回作成や在庫連携作成では、batch の結果が空なら `throw new Error(...)` する。[`purchaseRepository.ts`](/Users/inoueyuuji/mealcount/apps/api/src/modules/purchases/repositories/purchaseRepository.ts:19)

しかし、アプリケーション全体の `app.onError(...)` は現時点で定義されていない。そのため、想定外の DB 例外などは Hono / Workers の既定の 500 処理に委ねられ、エラー本文・ログ形式はアプリ独自に統一されていない。これは「500 を返さない」のではなく、「500 のアプリ固有の API 契約がまだない」という状態である。

## Web 側の受け取り方

Purchase の API 関数（例: [`updatePurchase.ts`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/api/updatePurchase.ts:12)）は、`result.ok` が false なら `Failed to update purchase` という `Error` を投げる。その時点で元の 401 / 404 / 409 と API の JSON エラー本文を失う。

React Query の `onError` は、作成・更新・削除に対して現状すべて「失敗しました」という toast を出す。[`PurchasesIndex.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/components/PurchasesIndex.tsx:35)

したがって現在の責務は次のように整理できる。

- **API**: HTTP の意味を区別して返す。
- **API クライアント関数**: 成功 / 失敗を判定して React Query に渡す。
- **画面**: 現状は失敗を一律表示する。

MVP では一律表示でも機能する。401 時のログイン誘導、409 時の「最新データを再読み込みしてください」、400 時の項目別エラー表示が必要になった時点で、クライアント関数が `status` と API の `error` を保持した独自エラーへ変換するのが自然な拡張箇所となる。

## 実装状況の評価

API の成功・失敗の区別は、MVP の CRUD と楽観的ロックに必要な範囲を超えて適切に設計されている。特に 401（未認証）、404（対象なし／非所有）、409（競合）の責務分離は明確である。

未実装なのは 403 ではなく、ロールに基づいて 403 を返す必要のある業務要件である。現在の「各ユーザーが自分の購入・在庫だけを扱う」仕様では、他人のデータを 404 にする方針と整合している。
