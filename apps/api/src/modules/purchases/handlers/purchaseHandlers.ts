import { calculatePurchaseService } from "@/modules/purchases/services/purchaseServices";
import type { Context } from "hono";
import type { CreatePurchaseData } from "@/modules/purchases/schemas/purchaseSchemas";

// Handlerでcontextの型を指定するためのInputContextを定義
// ここでInputContextの型を定義することで、Handler内でcontextの型を明示的に指定できるようにする
// in: { json: CreatePurchaseData } の形で入力を受け取り
// out: { json: CreatePurchaseData } の形で出力することを指定している
type InputContext = Context<
  any, // Request type
  any, // Response type
  {
    in: { json: CreatePurchaseData };
    out: { json: CreatePurchaseData };
  } // Input and Output types
>;

// validatedされたjsonデータを取得するためのHandler関数
export const purchaseHandler = async (c: InputContext) => {
  const data = c.req.valid("json");
  const result = await calculatePurchaseService.calculateAmount(data);
  return c.json(result, 201);
};
