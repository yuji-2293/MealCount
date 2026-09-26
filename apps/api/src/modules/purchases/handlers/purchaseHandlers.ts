import { calculatePurchaseService } from "../services/purchaseServices";
import type { Context } from "hono";
import { CreatePurchaseData } from "../schemas/purchaseSchemas";

// Handlerでcontextの型を指定するためのInputContextを定義
// ここでInputContextの型を定義することで、Handler内でcontextの型を明示的に指定できるようにする
type InputContext = Context<
  any,
  any,
  {
    in: { json: CreatePurchaseData };
    out: { json: CreatePurchaseData };
  }
>;

// validatedされたjsonデータを取得するためのHandler関数
export const purchaseHandler = async (c: InputContext) => {
  const data = c.req.valid("json");
  const result = await calculatePurchaseService.calculateAmount(data);
  return c.json(result, 201);
};
