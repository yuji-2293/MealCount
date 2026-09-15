import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import users from "./routes/users";

const app = new Hono();
app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});
app.route("/users", users);

// zod schemas
// zodの挙動検証
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

const objectSchema = z.object({
  id: z.number(),
  name: z.string(),
});

app.post("/validation", zValidator('json', objectSchema), (c) => {
  const data =  c.req.valid('json');
  console.log(data);
  return c.json(data);
});

export default app;
