import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Bindings } from "@/types/bindings";
import { findPurchaseHandler } from "@/modules/purchases/handlers/findPurchaseHandler";

import { purchaseSchema } from "@/modules/purchases/schemas/purchaseSchemas";

import { purchaseHandler } from "@/modules/purchases/handlers/purchaseHandler";
import { getPurchaseHandler } from "@/modules/purchases/handlers/getPurchaseHandler";

const purchases = new Hono<{ Bindings: Bindings }>();
purchases
  .get("/", getPurchaseHandler)
  .get("/:id", findPurchaseHandler)
  .post("/", zValidator("json", purchaseSchema), purchaseHandler);

export default purchases;
