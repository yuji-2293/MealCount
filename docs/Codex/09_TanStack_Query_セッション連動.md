# TanStack Query を Better Auth セッションに連動させる

## この文書の対象

2026-11-20 に取得した `origin/main` のコミット `6139fd1` を対象に、購入一覧の取得を Better Auth のセッションと TanStack Query に連動させている現在の実装を説明する。対象はアプリケーションコードではなく、既存実装の責務と挙動である。

## 結論

購入一覧では、Better Auth の `authClient.useSession()` から取り出した `userId` を次の二つの役割に使っている。

| 役割 | 現在の実装 | 得られること |
| --- | --- | --- |
| 取得の開始条件 | `enabled: !!userId` | 未ログイン時には購入一覧 API を呼ばず、ログインして `userId` が得られた時だけクエリを実行できる |
| キャッシュの識別子 | `queryKey: ['purchases', userId]` | ユーザーごとの購入一覧を別の TanStack Query キャッシュとして扱える |

この組み合わせは、Cookie セッションで API を認証する現在の構成に合っている。ただし、`enabled` は画面を隠す機能でもキャッシュを消す機能でもなく、`queryKey` もキャッシュを削除する機能ではない。表示制御とログアウト時のキャッシュ破棄は、別の責務として考える必要がある。

## 実装上のデータの流れ

```text
Better Auth の Cookie セッション
        │
        ▼
authClient.useSession() の data.user.id
        │ App で取得
        ▼
PurchasesIndex に userId を渡す（未取得時は ''）
        │
        ▼
usePurchases(userId)
  ├─ queryKey: ['purchases', userId]
  └─ enabled: !!userId
        │ userId があるときだけ GET /purchases
        ▼
Hono RPC client（Cookie を送信）
        │
        ▼
API の authMiddleware が Cookie を検証し、session.user.id で取得対象を限定
```

### セッションから `userId` を得る場所

[`App.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/App.tsx:10) は `authClient.useSession()` の `data?.user?.id` を `userId` として取り出し、[`PurchasesIndex.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/components/PurchasesIndex.tsx:8) へ渡している。セッションがない、またはまだ読込中で `data` がない間は空文字列を渡す。

[`auth-client.ts`](/Users/inoueyuuji/mealcount/apps/web/src/lib/auth-client.ts:3) は `credentials: 'include'` を指定している。また、購入 API 用の [`rpcClient.ts`](/Users/inoueyuuji/mealcount/apps/web/src/lib/rpcClient.ts:4) も Cookie を送る。したがって、`userId` はクライアントでの取得制御・キャッシュ識別に使われ、実際に「誰の購入か」を確定する認可は API 側の Cookie セッションが担う。

`userId` を query key に入れても、クライアントから API に所有者 ID を渡しているわけではない。[`fetchPurchases.ts`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/api/fetchPurchases.ts:3) は `GET /purchases` を呼ぶだけであり、サーバーはセッション由来のユーザー ID でデータを絞り込む。

## `enabled: !!userId` が担うこと

[`usePurchases.ts`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/hooks/usePurchases.ts:4) では、空文字列なら `!!userId` は `false`、有効なユーザー ID なら `true` になる。

| セッションの状態 | `userId` | `enabled` | 購入一覧クエリ |
| --- | --- | --- | --- |
| 未ログイン | `''` | `false` | 自動実行しない |
| セッション取得中で ID 未取得 | `''` | `false` | 自動実行しない |
| ログイン済み | 例: `user-a` | `true` | 有効な observer として API 取得を実行できる |
| ログアウト後 | `''` | `false` | 空 ID のクエリは自動実行しない |

ログインまたはログアウトにより `useSession()` の結果が変わると、`App` が再描画され、`usePurchases` も新しい `userId` と `enabled` で評価される。これは「ユーザー ID が得られるまで未認証 API 呼び出しを避ける」ためのクエリ実行制御である。

### `enabled` が担わないこと

`enabled: false` でも、`PurchasesIndex` コンポーネント自体は `App` から常に描画される。現在の [`PurchasesIndex.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/components/PurchasesIndex.tsx:69) は、取得データがなければ `No purchases found.` を表示する。そのため、未ログイン・セッション取得中に「購入一覧の UI を表示しない」ことは `enabled` 単独では実現していない。

また、`enabled` は API 側の認証を置き換えない。ブラウザから別経路でリクエストされても、API の `authMiddleware` がセッションを検証する必要がある。

## `queryKey: ['purchases', userId]` が担うこと

TanStack Query では query key がキャッシュの同一性を表す。したがって、次は別々のキャッシュである。

```text
['purchases', 'user-a']
['purchases', 'user-b']
['purchases', '']
```

ログイン中のユーザーが A から B に変われば、`usePurchases` は B 用の key を監視する。A 用の結果を B 用の key のデータとして再利用しないため、ユーザー間で購入一覧を同じキャッシュとして扱う事故を防げる。

購入の作成・更新・削除後は各 mutation hook が `['purchases']` を前方一致 key として `invalidateQueries` している。これは該当する購入一覧を古い状態として扱い、次の取得を促す操作である。`['purchases', userId]` という詳細 key を持つ現在の設計とも整合する。

### `queryKey` が担わないこと

key が A 用から空文字列用へ変わっても、`['purchases', 'user-a']` のキャッシュが削除されるわけではない。TanStack Query はキーごとに結果を保持し、不要になったキャッシュを明示的に削除する操作は別に存在する。

このため、ログアウト後の画面は通常、空文字列 key のデータを読むため A の一覧をそのまま表示しない。一方で A のデータは QueryClient 内に残り、同じユーザーが再ログインした場合などに再利用され得る。これは表示の分離と、機密データをメモリから破棄することが別問題であることを示している。

## ログアウト時のキャッシュクリアの責務

現在の [`signOutUser.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/features/auth/components/signOutUser.tsx:6) は `authClient.signOut()` を呼び、成功・失敗を toast で知らせる。`useQueryClient()`、`removeQueries()`、`clear()` は呼んでいない。従って、**現在の実装では購入一覧のキャッシュを明示的に消していない**。

ログアウト時に機密データをブラウザの TanStack Query キャッシュから直ちに破棄する要件があるなら、その責務は認証状態を切り替えるログアウト成功処理、または認証状態の遷移を一元管理する層に置く。

| 操作 | 意味 | 使い分け |
| --- | --- | --- |
| `invalidateQueries` | キャッシュを stale にし、必要時の再取得対象にする | 購入の作成・更新・削除後。削除ではない |
| `removeQueries` | 対象 query のキャッシュを削除する | `purchases` のように、ログアウト時に破棄したいユーザー固有データだけを対象にする場合 |
| `clear` | QueryClient の全 query と mutation の状態を消す | クライアントのキャッシュ全体がログインユーザーに属し、ログアウト時にすべて捨ててよい場合 |

どちらの削除範囲が正しいかは、今後「ユーザーによらない設定・マスターデータ」をキャッシュするかで決める。現時点では購入データの削除を求めるなら `purchases` を対象にする考え方が最小である。重要なのは、key の変更や `enabled: false` に削除まで期待しないことである。

## 表示制御の責務

ログイン状態に応じて「購入一覧コンポーネントを表示するか」を決める責務は、`enabled` ではなく React の条件付き描画にある。現在は `PurchasesIndex` が常に mount されるため、未ログイン時には取得せず、データがない表示になる。

表示要件が「未ログインなら一覧も操作 UI も出さない」であれば、セッションの `isPending`、ログイン済みかどうか、エラーを見て、一覧を描画する親コンポーネントまたは認証境界で分岐する設計が自然である。この変更をしても、一覧 hook 側の `enabled: !!userId` は、意図しない未認証取得を防ぐ防御として残せる。

## 現在の依存関係での代替案

### 条件付き mount を認証境界に置く

追加依存なしで、ログイン済みのときだけ `PurchasesIndex` を mount する方法がある。これは未ログイン時に `No purchases found.` を出したくない、ログイン前後の表示を明確に切り替えたい場合に有意である。

ただし、mount を外すだけではキャッシュは消えない。ユーザー別 key と、必要ならログアウト時の `removeQueries` または `clear` は引き続き別途必要である。

### `enabled` とユーザー別 key を維持する

「一覧コンポーネントは常に画面に置き、未ログイン時の文言は許容する」要件であれば、現在の `enabled: !!userId` と `['purchases', userId]` は適切であり、追加の依存関係は不要である。サーバー側で Cookie セッションを検証しているため、クライアント側に別の認証状態ライブラリや状態管理ライブラリを入れる必要はない。

## 読む順序

1. [`App.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/App.tsx:10) でセッションから `userId` を作る。
2. [`usePurchases.ts`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/hooks/usePurchases.ts:4) で key と `enabled` を確認する。
3. [`PurchasesIndex.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/features/purchases/components/PurchasesIndex.tsx:8) で、クエリ結果をどのように画面へ出しているかを確認する。
4. [`signOutUser.tsx`](/Users/inoueyuuji/mealcount/apps/web/src/features/auth/components/signOutUser.tsx:6) で、現在はキャッシュ操作がないことを確認する。
5. API 側の認可は [`07_認証・認可_実装レビュー.md`](/Users/inoueyuuji/mealcount/docs/Codex/07_認証・認可_実装レビュー.md:1) を参照する。
