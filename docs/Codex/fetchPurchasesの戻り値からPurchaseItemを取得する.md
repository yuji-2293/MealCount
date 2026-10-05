# `fetchPurchases`の戻り値から`PurchaseItem`を取得する

## 目的

購入一覧の1件を編集する`handleEdit`の引数に、GET APIが実際に返す要素の型を付けた。

```ts
type PurchaseItem = Awaited<ReturnType<typeof fetchPurchases>>[number];

const handleEdit = (purchase: PurchaseItem) => {
  // ...
};
```

この方法により、Purchaseの表示・編集で使う型をフロントエンドに重複定義せず、`fetchPurchases`の戻り値から導出できる。

## 型が導出されるまで

対象: `apps/web/src/features/purchases/api/fetchPurchases.ts`

```ts
export default async function fetchPurchases() {
  const res = await client.purchases.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch purchases');
  }
  return res.json();
}
```

`fetchPurchases`は`async`関数なので、返り値は概念的に次のようなPromiseである。

```ts
Promise<PurchaseResponseItem[]>
```

ここで`PurchaseResponseItem`は、GET `/purchases`のレスポンス配列に含まれる1要素である。実際には次のように`purchase`と`amounts`を持つ。

```ts
type PurchaseResponseItem = {
  purchase: {
    id: number;
    purchaseDate: string;
    sameDayAmount: number;
    plannedAmount: number;
    monthlyAmount: number;
    purchasedMealCount: number;
    createdAt: string;
    updatedAt: string;
  };
  amounts: {
    totalAmount: number;
    totalRealAmount: number;
    oneMealCost: number;
  };
};
```

この型は手書きではない。バックエンドRouteから`AppType`へ伝播し、`hc<AppType>(...)`で作成した`client`を通じて、`res.json()`の戻り値に反映される。

```text
GET /purchases のRouteレスポンス
  ↓ AppType
hc<AppType>(...) の client
  ↓
client.purchases.$get()
  ↓
res.json()
  ↓
fetchPurchases(): Promise<PurchaseResponseItem[]>
```

## `PurchaseItem`の分解

```ts
type PurchaseItem = Awaited<ReturnType<typeof fetchPurchases>>[number];
```

### 参考[numberインデックスで配列の要素型を取得する]
```ts
type A = string[];

// [number] は「number型のインデックスでアクセスしたときの要素型」を取る
// 感覚的には [n] の n が 0, 1, 2, 3... のどれでもあり得るイメージ

type B = A[number];

// つまり
// A[0] も string
// A[1] も string
// A[2] も string
// 任意の number インデックスで取り出せる要素型は string

// なので B は string 型

type B = string;
```

内側から順に読む。

### 1. `ReturnType<typeof fetchPurchases>`

`typeof fetchPurchases`は関数そのものの型を取得する。`ReturnType`は、その関数の戻り値型を取り出すTypeScript標準ユーティリティ型である。

```ts
type FetchPurchasesResult = ReturnType<typeof fetchPurchases>;
// Promise<PurchaseResponseItem[]>
```

### 2. `Awaited<...>`

`Awaited`はPromiseが解決された後の型を取得する。

```ts
type Purchases = Awaited<FetchPurchasesResult>;
// PurchaseResponseItem[]
```

`fetchPurchases`は非同期関数なので、`ReturnType`だけでは`Promise<...>`のままである。配列の要素型を取り出す前に、`Awaited`でPromiseを外す必要がある。

### 3. `[number]`

配列型に`[number]`を付けると、その配列の任意の1要素の型を取り出せる。

```ts
type PurchaseItem = Purchases[number];
// PurchaseResponseItem
```

`[0]`のように特定の添字を意味するものではない。`number`は「数値の添字で取得できる任意の要素」を表す。

したがって、型の変換全体は以下のようになる。

```text
typeof fetchPurchases
  ↓ ReturnType
Promise<PurchaseResponseItem[]>
  ↓ Awaited
PurchaseResponseItem[]
  ↓ [number]
PurchaseResponseItem
```

## `handleEdit`での利用

対象: `apps/web/src/features/purchases/components/PurchasesIndex.tsx`

```ts
const handleEdit = (purchase: PurchaseItem) => {
  setEditId(purchase.purchase.id);
  setPlannedAmount(purchase.purchase.plannedAmount);
  setSameDayAmount(purchase.purchase.sameDayAmount);
  setMonthlyAmount(purchase.purchase.monthlyAmount);
  setPurchasedMealCount(purchase.purchase.purchasedMealCount);
  setPurchaseDate(purchase.purchase.purchaseDate);
};
```

`purchases?.map((purchase) => ...)`の`purchase`も一覧配列の1要素である。したがって、`handleEdit(purchase)`へ渡す値と`PurchaseItem`は一致する。

この型注釈により、たとえば存在しない`purchase.purchase.name`を参照したり、`id`に文字列として扱うようなコードは、実行前にTypeScriptが検出できる。

## なぜ手書きの型ではなく関数の戻り値から取得するのか

手書きの`type PurchaseItem = { ... }`では、APIレスポンスの変更時に別の型定義を手動で追従させる必要がある。追従漏れがあると、実際のレスポンスと画面側の型定義がずれる。

今回の書き方は、既存のデータ取得関数を唯一の参照点にする。

```text
バックエンドのGETレスポンス変更
  ↓
fetchPurchases の戻り値型が変化
  ↓
PurchaseItem も自動的に変化
  ↓
handleEdit の不整合はTypeScriptエラーになる
```

このため、表示・編集対象がGET一覧の要素そのものである現在の用途では、型の重複を避けられる。

## 適用範囲

`PurchaseItem`は「GET一覧が返す1要素」の型であり、PATCHリクエストのbody型ではない。更新リクエストの`json`と`param`は、`updatePurchase.ts`で`InferRequestType<typeof $patch>`から取得する型が担う。

つまり、用途を次のように分けている。

| 型 | 取得元 | 使う場面 |
| --- | --- | --- |
| `PurchaseItem` | `fetchPurchases`の戻り値 | 一覧の1行を表示・編集フォームへ読み込む場面 |
| `UpdatePurchaseParams` | Hono RPCの`$patch` | PATCHリクエストを送る場面 |
