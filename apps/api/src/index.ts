import { Hono } from "hono";
import users from "./routes/users";
import purchases from "./routes/purchases";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});
app.route("/users", users);
app.route("/purchases", purchases);

export default app;
