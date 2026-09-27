<!-- Hono context documentation -->
# Hono Context
## Honoの内部型定義
```
// Hono内部の型定義（イメージ）
class Context<
  E extends Env = any,  // 第1型引数
  P extends string = any,
  I extends Input = {}
> {
  env: E["Bindings"];  // ← ここがポイント！
  // ...
}
```

Context = c
E, P, Iについて
- E: Env型。Honoの環境変数やバインディングを含む。
- P: パスパラメータの型。
- I: 入力の型。

> cloudflare workers環境では、Contextのenvプロパティを通じてD1Databaseなどのバインディングにアクセスできる。
const d1 = c.env.meal_count_db;
d1に型付する時、contextのenvプロパティに型情報をつける。
その時、contextの型引数[E, P, I]のEに型情報をつける。例えば、BindingsにD1Databaseの型を含める場合は以下のようにする。

```ts
type InputContext = Context<
  { Bindings: { meal_count_db: D1Database } }, // env with bindings
  any, // path parameters
  any // input type
>;
```

## まとめ
まとめ表
型引数	役割	影響する c. のプロパティ
E	Bindings / Variables	c.env, c.get(), c.set()
P	パスのリテラル型	c.req.param()
I	バリデーション済み入出力	c.req.valid()
