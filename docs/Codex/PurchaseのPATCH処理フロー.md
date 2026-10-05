# PurchaseのPATCH処理フロー

## 目的

購入一覧で選択したPurchaseを編集し、`PATCH /purchases/:id`で更新する処理を追加した。

この文書では、画面操作からDB更新、一覧の再取得までの**処理の責務と流れ**を記録する。`fetchPurchases`の戻り値から`PurchaseItem`型を取り出す方法は、[PurchaseItemの型取得](/Users/inoueyuuji/mealcount/docs/Codex/fetchPurchasesの戻り値からPurchaseItemを取得する.md)に分ける。

## 全体の流れ

```text
一覧で edit を押す
  ↓
編集対象の値を React の state にコピーする
  ↓
input で state を変更する
  ↓
更新するよ を押す
  ↓
updateMutate({ json, param })
  ↓
useUpdatePurchases の mutationFn
  ↓
updatePurchase({ json, param })
  ↓
Hono RPC: PATCH /purchases/:id
  ↓
zValidator で JSON を検証
  ↓
purchaseService.updatePurchase
  ↓
purchaseRepository.update / D1
  ↓
成功時に ['purchases'] を invalidate
  ↓
fetchPurchases による一覧の再取得・再描画
```

## フロントエンドの役割

### 1. 一覧と編集状態

対象: `apps/web/src/features/purchases/components/PurchasesIndex.tsx`

`purchases`は`usePurchases`が取得した一覧データである。各行の`edit`ボタンは`handleEdit`を呼び、選択したPurchaseの各値をフォーム用stateに設定する。

```ts
setEditId(purchase.purchase.id);
setPlannedAmount(purchase.purchase.plannedAmount);
// ...
```

`editId`と行の`purchase.purchase.id`が一致する場合だけ、その行に編集用inputを表示する。

```ts
{editId === purchase.purchase.id && (
  <div className="edit-fields">...</div>
)}
```

この設計では、一覧データそのものを直接変更しない。入力中の値はコンポーネントのstateに保持し、更新リクエストが成功した後にサーバーの値を取り直す。

### 2. 更新リクエストを作る

`handleUpdate`は、フォームstateと対象IDをHono RPCの入力形式に組み立てて`updateMutate`へ渡す。

```ts
updateMutate({
  json: {
    plannedAmount,
    sameDayAmount,
    monthlyAmount,
    purchasedMealCount,
    purchaseDate,
  },
  param: { id: String(id) },
});
```

ここで、次の2つを分けている。

- `json`: 更新するPurchaseの項目
- `param`: URLの`:id`に入る識別子。URLパラメータなので文字列に変換する

リクエストを開始した後、`setEditId(null)`で編集フォームを閉じる。

### 3. React Queryの更新処理

対象: `apps/web/src/features/purchases/hooks/useUpdatePurchases.ts`

`useUpdatePurchases`は、`updatePurchase`を`useMutation`の`mutationFn`に登録する。コンポーネントはHTTP通信の詳細を持たず、`mutate`を呼ぶ役割だけを担う。

```ts
const mutation = useMutation({
  mutationFn: updatePurchase,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
  },
});
```

更新が成功すると、`['purchases']`というキャッシュを無効化する。このキーは`usePurchases`の`useQuery`と共通であるため、React Queryは一覧を再取得し、画面には更新後のサーバー値が表示される。

### 4. Hono RPCを呼び出す関数

対象: `apps/web/src/features/purchases/api/updatePurchase.ts`

```ts
const $patch = client.purchases[':id'].$patch;

export default async function updatePurchase({ json, param }: UpdatePurchaseParams) {
  const result = await $patch({ json, param });
  if (!result.ok) {
    throw new Error('Failed to update purchase');
  }
  return result.json();
}
```

`client.purchases[':id'].$patch`は、バックエンドの`PATCH /purchases/:id`に対応するRPC関数である。`InferRequestType<typeof $patch>`から取得した`UpdatePurchaseParams`を関数引数に使うことで、`json`と`param`の両方がRoute契約に従う。

## バックエンドの役割

### 5. Routeで入力を検証し、Serviceへ渡す

対象: `apps/api/src/modules/purchases/routes/purchaseRoutes.ts`

```ts
.patch('/:id', zValidator('json', updatePurchaseSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const result = await purchaseService.updatePurchase(Number(id), data, d1);
  // ...
})
```

Routeの責務はHTTPに関する処理である。

- URLパラメータから`id`を取得し、Serviceへ渡す前に`number`へ変換する
- `zValidator`でJSON bodyを検証する
- 検証済みの`data`をServiceへ渡す
- 対象が存在しない場合は`404`、成功時は`200`を返す

`updatePurchaseSchema`は`purchaseSchema.partial()`で作られている。そのため、更新可能な各項目は省略可能であり、PATCHの部分更新を表現している。

### 6. Serviceが更新後のレスポンスを作る

対象: `apps/api/src/modules/purchases/services/purchaseServices.ts`

`purchaseService.updatePurchase`はRepositoryに更新を依頼し、更新後のPurchaseから金額を再計算して、`{ purchase, amounts }`というレスポンスを組み立てる。

```text
Routeの検証済み data
  ↓
purchaseRepository.update(id, d1, data)
  ↓
更新後のDB行
  ↓
calculateTotalAmount(...)
  ↓
{ purchase, amounts }
```

このため、PATCHのレスポンスはGET一覧の各要素と同じ形を持つ。

## 責務の境界

| 層 | 主な責務 |
| --- | --- |
| `PurchasesIndex` | 編集対象の選択、フォームstate、`mutate`の呼び出し、表示の切替 |
| `useUpdatePurchases` | 更新成功後に一覧キャッシュを無効化する |
| `updatePurchase` | Hono RPCでPATCHリクエストを送信し、失敗を例外にする |
| Route | HTTPパラメータ取得、JSON検証、HTTPステータスの決定 |
| Service | 更新の調整、金額計算、レスポンス構築 |
| Repository | D1に対する更新 |

## 補足: 現在の更新タイミング

現状は`updateMutate`の直後に編集フォームを閉じる。そのため通信に失敗した場合もフォームは閉じる。一方、一覧キャッシュの再取得は`onSuccess`だけで行われるので、失敗時に表示中の一覧データが成功したように書き換わることはない。

