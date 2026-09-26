import { Hono } from "hono";

const users = new Hono();

users.get("/:id", (c) => {
  return c.json({ message: "Hello Users!" });
});

export default users;
