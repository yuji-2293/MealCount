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

export default app;
