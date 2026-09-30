import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { purchaseSchema } from "@/modules/purchases/schemas/purchaseSchemas";
import { purchaseHandler } from "@/modules/purchases/handlers/purchaseHandler";
import type { Bindings } from "@/types/bindings";

const purchases = new Hono<{ Bindings: Bindings }>();

import { getPurchaseHandler } from "@/modules/purchases/handlers/getPurchaseHandler";

purchases.get("/", getPurchaseHandler);

purchases.post("/", zValidator("json", purchaseSchema), purchaseHandler);

export default purchases;
