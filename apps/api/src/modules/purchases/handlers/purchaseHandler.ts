import { purchaseService } from "@/modules/purchases/services/purchaseServices";
import type { Context } from "hono";
import type { PurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";
import type { Bindings } from "@/types/bindings";
// Handlerでcontextの型を指定するためのInputContextを定義
type InputContext = Context<
  { Bindings: Bindings },
  any,
  {
    in: { json: PurchaseData };
    out: { json: PurchaseData };
  } // Input and Output types
>;

// validatedされたjsonデータを取得するためのHandler関数
export const purchaseHandler = async (c: InputContext) => {
  // 必要な依存であるD1Databaseを取得
  const d1 = c.env.meal_count_db;

  const data = c.req.valid("json");
  const result = await purchaseService.createPurchase(data, d1);
  return c.json(result, 201);
};
