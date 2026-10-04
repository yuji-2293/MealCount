# Purchase作成処理における型伝播

## 結論

MealCountの購入作成処理では、バックエンドのZod schemaを起点にして、HonoのRoute型、Hono RPC client、購入作成関数、React Queryの`mutate`へとリクエスト型が伝播する。

```text
purchaseSchema
  ↓ zValidator が Route の入力型に反映
POST /purchases
  ↓ AppType = typeof routes
hc<AppType>(...)
  ↓ client.purchases.$post の型
InferRequestType<typeof $post>['json']
  ↓ postPurchase(data)
useMutation({ mutationFn: postPurchase })
  ↓ mutate(data)
PurchasesCreate のフォーム値
```

実行時のリクエスト処理は次の順で進む。

```text
mutate(data)
→ postPurchase(data)
→ client.purchases.$post({ json: data })
→ POST /purchases
→ zValidator による検証
→ purchaseService.createPurchase
→ Repository / D1
```

## 1. 型の起点: Zod schema

`apps/api/src/modules/purchases/schemas/purchaseSchemas.ts` の `purchaseSchema` が、購入作成リクエストのJSON構造を定義している。

```ts
export const purchaseSchema = z.object({
  purchasedMealCount: z.number().positive().int(),
  sameDayAmount: z.number().nonnegative().int(),
  plannedAmount: z.number().nonnegative().int(),
  monthlyAmount: z.number().nonnegative().int(),
  purchaseDate: z.string(),
});
```

このschemaから、次の型が推論される。

```ts
type CreatePurchaseData = z.infer<typeof purchaseSchema>;
```

概念的には以下の形である。

```ts
type CreatePurchaseData = {
  purchasedMealCount: number;
  sameDayAmount: number;
  plannedAmount: number;
  monthlyAmount: number;
  purchaseDate: string;
};
```

TypeScriptの型としては各値が`number`または`string`であることを表す。一方、`positive()`、`int()`、`nonnegative()`といった制約は実行時にZodが検証する。

そのため、たとえば`purchasedMealCount: 0`はTypeScriptの型チェックでは通るが、リクエスト到着後にZodの`.positive()`で拒否される。

## 2. Routeへの型の反映

`apps/api/src/modules/purchases/routes/purchaseRoutes.ts` の購入作成Routeでは、`zValidator`にschemaを渡している。

```ts
.post('/', zValidator('json', purchaseSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await purchaseService.createPurchase(data, d1);
  return c.json(result, 201);
})
```

`zValidator('json', purchaseSchema)`により、Honoは`POST /purchases`がこの形のJSONを受け取ることを型情報として保持する。

また、`c.req.valid('json')`の返り値`data`も`CreatePurchaseData`として推論される。そのため、Serviceの`createPurchase`が受け取る入力型とRouteで検証済みの入力型が一致する。

## 3. `AppType`がAPIの設計図になる

`apps/api/src/index.ts`では、Routeを登録した結果から`AppType`を作成している。

```ts
const routes = app.route('/purchases', purchases);

export type AppType = typeof routes;
export default routes;
```

`AppType`は実行時のAPI本体ではない。`/purchases`にどのHTTPメソッドがあり、それぞれが何を受け取って何を返すかを表す、コンパイル時専用の型情報である。

## 4. `hc<AppType>`が型付きRPC clientを作る

`apps/web/src/lib/rpcClient.ts`では、`AppType`をHono clientに渡している。

```ts
const client = hc<AppType>(import.meta.env.VITE_API_BASE_URL);
```

この結果、`client.purchases.$post`は任意のJSONを送れる関数ではなく、バックエンドの`POST /purchases`が受け取れるJSONだけを送れる関数になる。

## 5. `InferRequestType`の役割

`apps/web/src/features/purchases/api/createPurchase.ts`では、`$post`からリクエストのJSON型を取り出している。

```ts
const $post = client.purchases.$post;

type PostPurchaseRequest = InferRequestType<typeof $post>['json'];
```

`typeof $post`は、`client.purchases.$post`という関数そのものの型を取得する。

`InferRequestType<typeof $post>`は、そのHono client関数に渡せるリクエスト設定全体の型を取り出す。概念的には次の形である。

```ts
type PostOptions = {
  json: {
    purchasedMealCount: number;
    sameDayAmount: number;
    plannedAmount: number;
    monthlyAmount: number;
    purchaseDate: string;
  };
};
```

最後の`['json']`は、この設定全体からJSON bodyだけを取り出す操作である。

```ts
type PostPurchaseRequest = PostOptions['json'];
```

これを利用して、購入作成関数の引数を定義している。

```ts
export default async function postPurchase(data: PostPurchaseRequest) {
  const res = await $post({ json: data });
  // ...
}
```

つまり、`postPurchase`に渡せる`data`は、Hono側の`POST /purchases`が要求するJSON構造と一致する必要がある。

## 6. `useMutation`から`mutate`への伝播

`apps/web/src/features/purchases/hooks/useCreatePurchase.ts`では、`postPurchase`を`mutationFn`として渡している。

```ts
const mutation = useMutation({
  mutationFn: postPurchase,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
  },
});
```

React Queryは`mutationFn`の引数型を読み取る。そのため、`mutation.mutate`の引数は`PostPurchaseRequest`として推論される。

`apps/web/src/features/purchases/components/PurchasesCreate.tsx`で、フォーム状態を渡す`mutate`も同じ型に制約される。

```ts
mutate({
  plannedAmount,
  sameDayAmount,
  monthlyAmount,
  purchasedMealCount,
  purchaseDate,
});
```

たとえば`plannedAmount: '1000'`のように文字列を渡せば、HTTP通信より前にReact側のTypeScriptチェックで検出できる。

## `InferRequestType`と`Parameters<typeof createPurchase>[0]`の違い

現在のMealCountでは`Parameters<typeof createPurchase>[0]`は使用していない。また、購入作成用の関数名は`createPurchase`ではなく`postPurchase`である。

現在の関数に対して書くなら、次のようになる。

```ts
type Variables = Parameters<typeof postPurchase>[0];
```

`Parameters<T>`はTypeScript標準のユーティリティ型である。関数`T`の引数をタプル型として取り出し、`[0]`で第1引数の型を得る。

```ts
type Parameters<typeof postPurchase> = [PostPurchaseRequest];
type Variables = Parameters<typeof postPurchase>[0];
// Variables は PostPurchaseRequest と同じ型
```

両者の違いは、型を取得する場所にある。

| 書き方 | 型の情報源 | 意味 |
| --- | --- | --- |
| `InferRequestType<typeof $post>['json']` | Hono RPC client | APIが受け取るHTTP request bodyを直接取り出す |
| `Parameters<typeof postPurchase>[0]` | 自作の`postPurchase`関数 | その関数の第1引数の型を再利用する |

MealCountにおける依存関係は次の通りである。

```text
Hono Route / Zod
  → InferRequestType<typeof $post>['json']
    → PostPurchaseRequest
      → postPurchase(data)
        → Parameters<typeof postPurchase>[0]
```

`Parameters<typeof postPurchase>[0]`はHonoやZodを直接参照しない。すでに`postPurchase`に付与されている型を再利用するだけである。

一方、`InferRequestType<typeof $post>['json']`は、HonoのRoute契約からrequest body型を直接導く。そのため、APIリクエストの型を定義する地点として、現在のMealCountのRPC方針に適している。
