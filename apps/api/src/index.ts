import { Hono } from "hono";
import users from "./modules/purchases/routes/purchaseRoutes";
import purchases from "./modules/purchases/routes/purchaseRoutes";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});
app.route("/users", users);
app.route("/purchases", purchases);

export default app;
