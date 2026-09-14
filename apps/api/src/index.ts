import { Hono } from "hono";
import users from "./routes/users";

const app = new Hono();

app.route("/users", users);

app.use("*", async (c, next) => {
  console.log("middleware A start");
  await next();
  console.log("middleware A end");
});

app.use("*", async (c, next) => {
  console.log("middleware B start");
  await next();
  console.log("middleware B end");
});
app.get("/", (c) => {
  console.log("middleware");
  return c.json({ message: "Hello Hono!" });
});
export default app;
