import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import users from "./routes/users";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});
app.route("/users", users);

export default app;
