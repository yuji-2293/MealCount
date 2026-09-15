import { Hono } from "hono";
import users from "./routes/users";

const app = new Hono();

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
  const isAuthenticated = false;
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
export default app;
