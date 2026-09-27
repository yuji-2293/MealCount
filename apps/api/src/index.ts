import { Hono } from "hono";
import purchases from "@/modules/purchases/routes/purchaseRoutes";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});
app.route("/purchases", purchases);

export default app;
