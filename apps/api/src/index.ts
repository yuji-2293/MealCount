import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id, name: `User ${id}` });
});
app.get("/search", (c) => {
  const q = c.req.query("q");
  const qq = c.req.query();
  return c.json({ q, qq });
});

app.post("/post", async (c) => {
  const body = await c.req.json();
  const id = body.id;
  const name = body.name;
  return c.json({
    body,
    message: "post successful",
    response: { id, name },
  });
});

app.post("/validation", async (c) => {
  let body;
  // jsonの取得でエラーが起きてないか確認する
  try {
    body = await c.req.json();
  } catch (error) {
    console.error(error);
    c.status(400);
    return c.json({
      error: "json parse error",
    });
  }
  // 取得したjsonの中身からidとnameを取り出す
  const id = body.id;
  const name = body.name;
  // 取り出したidとnameの型を確認するvalidationにかける
  if (typeof id !== "number" || typeof name !== "string") {
    c.status(400);
    return c.json({
      error: "Bad Request",
    });
  }
  // validationに成功した場合のレスポンスを返す
  return c.json({
    message: "Validation successful",
  });
});

export default app;
