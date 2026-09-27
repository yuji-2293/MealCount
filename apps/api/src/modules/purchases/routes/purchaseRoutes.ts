import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { purchaseSchema } from "@/modules/purchases/schemas/purchaseSchemas";
import { purchaseHandler } from "@/modules/purchases/handlers/purchaseHandlers";

const purchases = new Hono();

purchases.get("/", (c) => {
  return c.json({ message: "List of purchases" });
});

purchases.post("/", zValidator("json", purchaseSchema), purchaseHandler);

export default purchases;
