```
// Middleware A
// useはグローバルに全てのルートに対してMiddlewareを登録する
app.use("*", async (c, next) => {
  console.log("middleware A start");
  await next();
  console.log("middleware A end");
});
// Middleware B
app.use("*", async (c, next) => {
  console.log("middleware B start");
  await next();
  console.log("middleware B end");
});

app.use("*", async (c, next) => {
  const isAuthenticated = true;
  if (!isAuthenticated) {
    c.status(401);

    return c.json({ message: "Unauthorized", error: "Not authenticated" });
  }
  await next();
});

app.route("/users", users);

app.get("/", (c) => {
  console.log("middleware");
  return c.json({ message: "Hello Hono!" });
});

app.get("/error", (c) => {
  throw new Error("This is a test error");
});

app.onError((err, c) => {
  console.error(err);
  // 以下は同じ500エラーを返す処理
  // １つ目は、c.statusでステータスコードを設定してからc.jsonで返す方法
  // ２つ目は、c.jsonで第二引数にステータスコードを渡す方法
  c.status(500);
  return c.json({ message: "Internal Server Error", error: err.message }, 500);
});

app.notFound((c) => {
  c.status(404);
  return c.json({ message: "Not Found" });
});

```
