import { purchaseService } from "@/modules/purchases/services/purchaseServices";
import type { Bindings } from "@/types/bindings";
import type { GetPurchaseResponse } from "@/modules/purchases/types/purchaseTypes";
import type { Context } from "hono";

type OutPutContext = Context<
  { Bindings: Bindings },
  any,
  {
    out: { json: GetPurchaseResponse[] };
  }
>;

export const getPurchaseHandler = async (c: OutPutContext) => {
  const d1 = c.env.meal_count_db;
  const allPurchases = await purchaseService.getAllPurchases(d1);
  return c.json(allPurchases, 200);
};
