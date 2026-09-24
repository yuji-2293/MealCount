import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const purchases = new Hono();
const purchaseSchema = z.object({
  purchasedMealCount: z.number(),
  sameDayAmount: z.number(),
  plannedAmount: z.number(),
  monthlyAmount: z.number(),
  purchaseDate: z.string(),
});

purchases.get("/", (c) => {
  return c.json({ message: "List of purchases" });
});

purchases.post("/", zValidator("json", purchaseSchema), (c) => {
  const test = c.req.valid("json");
  console.log(test);
  return c.json({ message: "Purchase created", data: test }, 201);
});

export default purchases;
