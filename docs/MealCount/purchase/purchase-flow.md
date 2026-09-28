POST /purchase
POSTからDBにデータが保存される流れ

```ts
Client
  │
  │ POST /purchases
  │ JSON
  ▼
Route
  │
  ▼
zValidator
  │ purchaseSchemaで検証
  │
  ▼
Handler
  │ c.req.valid("json")
  │ c.env.meal_count_db
  │
  ▼
Purchase Service
  │
  ├── Purchaseの計算
  │     └─ PurchaseAmounts
  │
  └── Purchase Repository
          │
          ▼
       Drizzle
          │
          ▼
       Local D1
          │
          │ INSERT
          ▼
       purchases
          
Serviceへ戻る
  │
  │ 保存結果 + 計算結果
  ▼
Handler
  │
  │ c.json(result, 201)
  ▼
Client

```

## 導入したこと
- Drizzle ORM
- cloudflare D1
  - Local D1
- sqlite

## 責務分離
- Client: ユーザーからのリクエストを受け取る
- Route: リクエストを適切なハンドラーにルーティングする
- zValidator: リクエストのバリデーションを行う
- Handler: リクエストを処理し、レスポンスを返す
  - 不正なアクセスはここで弾く
- Purchase Service: ビジネスロジックを担当する
- Purchase Repository: データベースとのやり取りを担当する
- Drizzle: ORMとしてデータベース操作を担当する

### Flowの概要
- handler: HTTPとServiceの橋渡し役
  - handlerは、処理を渡す役割に集中し、処理内容に干渉しない
  - Serviceからの結果をそのままクライアントに返す
  - Honoの機能領域、Serviceにcontextを渡さず、必要なデータのみを引数として渡す
```ts
const d1 = c.env.meal_count_db; // Local D1へのアクセス用
const data = c.req.valid("json"); // リクエストボディのJSONデータを取得

const result = await purchaseService.createPurchase(data, d1); // Serviceを介してPurchaseを作成し、計算結果を取得

return c.json(result, 201);
```

- Service: ビジネスロジックを担当し、計算やデータベース操作の指示を行う
  - purchaseを作成し、計算結果を返す役割に集中
  - データベース操作の詳細には関与せず、Repositoryに指示を出す
```ts
createPurchase() // Serviceが呼び出される
   │
   ├── calculateTotalAmount() // 合計金額を計算する
   │
   │      ↓
   │   PurchaseAmounts // 計算結果の合計金額を保持
   │
   └── purchaseRepository.create() // データベースに保存する処理をrepositoryに任せる

```
- Repository: データベース操作を担当し、Serviceからの指示に従ってデータを保存する
  - Serviceからの指示に従ってデータを保存する役割に集中
```
drizzle(d1)
→ D1をDrizzle経由で操作できるようにする

.insert(purchases)
→ INSERTする対象テーブルを指定

.values({...})
→ INSERTするカラムと値を指定
→ created_at など、DB保存時に必要な値もここで渡す

.returning()
→ INSERTしたレコードをDBから返してもらう

const [result]
→ returning()が返した配列から最初の1件を取り出す

return result
→ Repositoryの呼び出し元（Service）へ返す

```
- Drizzle: ORMとしてデータベース操作を担当し、Repositoryからの指示に従ってLocal D1を介してデータベース操作を行う
- DB : 実際にデータが保存される場所。Local D1を介して操作される。
  - API -> Zodによるバリデーションがあるが、DBにもCHECK制約を設けてデータの整合性を保つ
  - 

## 実装の手順
- Drizzle ORMの導入
- Cloudflare にユーザー登録
- Local D1のセットアップ
- drizzle.config.tsの作成
- db/schema.tsの作成
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // schema の定義場所
  schema: "./src/db/schema.ts",
  // 出力先のディレクトリ
  out: "./drizzle",
  // 使用するSQLの種類
  dialect: "sqlite",
});
```

- 上記のファイルを作成したら、Drizzle ORMを使用してデータベース操作を行えるようになる
` pnpm drizzle-kit generate `を実行
- マイグレーションを実行してデータベースに反映
- Drizzle Kit
- 0000_....sqlが生成される
- Local D1をセットアップして、適用を確認
- D1 bindingsを設定
  - ルートにD1のバインディング用の型を定義したファイルを作成
- HonoにもD1のバインディングを設定
  - ` new Hono<{ Bindings: Bindings }>() `
- ` c.env.meal_count_db `が使用可能になる
- これで、Handler内で`c.env.meal_count_db`を使ってLocal D1にアクセスできるようになる
- Repositoryの作成
