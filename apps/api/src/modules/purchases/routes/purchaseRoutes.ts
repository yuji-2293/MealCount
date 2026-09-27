import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { purchaseSchema } from "@/modules/purchases/schemas/purchaseSchemas";
import { purchaseHandler } from "@/modules/purchases/handlers/purchaseHandlers";
import type { Bindings } from "@/types/bindings";

const purchases = new Hono<{ Bindings: Bindings }>();

purchases.get("/", (c) => {
  return c.json({ message: "List of purchases" });
});

purchases.post("/", zValidator("json", purchaseSchema), purchaseHandler);

export default purchases;
