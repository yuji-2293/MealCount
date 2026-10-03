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
 - client.purchases.$get()  // GET /purchases
 - client.purchases.$post()  // POST /purchases
 - client.purchases.$delete(id)  // DELETE /purchases/{id}
 - client.purchases.$get(id)  // GET /purchases/{id}
 - client.purchases.$update(id)  // PATCH /purchases/{id}

### 概要
RPC(client.*)を使用して、Hono側からReactへ型情報を渡している
この方法により、React側でAPIの型安全性を確保しつつ、エンドポイントの変更に柔軟に対応できる。
