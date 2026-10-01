import type { Context } from "hono";
import { purchaseService } from "@/modules/purchases/services/purchaseServices";
import type { Bindings } from "@/types/bindings";
import type { GetPurchaseResponse } from "@/modules/purchases/types/purchaseTypes";

type OutPutContext = Context<
  { Bindings: Bindings },
  any,
  {
    out: { json: GetPurchaseResponse };
  }
>;

export const findPurchaseHandler = async (c: OutPutContext) => {
  const d1 = c.env.meal_count_db;
  const purchaseId = c.req.param("id");
  const Id = Number(purchaseId);
  const purchase = await purchaseService.findPurchaseById(Id, d1);
  return c.json(purchase, 200);
};
