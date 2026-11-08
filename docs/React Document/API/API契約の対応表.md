# API契約の対応表
## Purchase API
### Reactフロントエンド対応
- エンドポイント
  - GET /purchases
  - POST /purchases
  - DELETE /purchases/{id}
  - GET /purchases/{id}
  - PATCH /purchases/{id}
- RPC(client.*)
```

 client.purchases.$get()  // GET /purchases

 client.purchases.$post()  // POST /purchases

 client.purchases['id'].$delete({
  param: { id }
 });

 client.purchases['id'].$get({
  param: { id }
 });
 client.purchases['id'].$patch({
  param: { id },
  json: {data}
 });

```

### 概要
- RPC(client.*)を使用して、Hono側からReactへ型情報を渡している
- この方法により、React側でAPIの型安全性を確保しつつ、エンドポイントの変更に柔軟に対応できる。
- API側に変更があった時、React側のRPC呼び出しも自動的に型チェックされるため、型エラーとして検出される。
  
### RPC型共有に関する方針

- API側で `AppType` をexportし、Web側からHono RPCで参照する。
- Request / Response型はReact側で重複定義しない。
- API内部では相対importを使用する。
- `@/*` aliasを使用した際、Web側からAppTypeを参照すると
  RPCの型推論が崩れたため、現状は型共有の安定性を優先する。
