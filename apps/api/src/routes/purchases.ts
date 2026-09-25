import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { purchaseSchema } from "../schemas/purchase";

const purchases = new Hono();

purchases.get("/", (c) => {
  return c.json({ message: "List of purchases" });
});

purchases.post("/", zValidator("json", purchaseSchema), (c) => {
  const data = c.req.valid("json");

  console.log(data);

  const totalAmount =
    data.sameDayAmount + data.plannedAmount + data.monthlyAmount;
  const totalRealAmount = data.sameDayAmount + data.plannedAmount;
  const oneMealCost = totalRealAmount / data.purchasedMealCount;
  return c.json({ totalAmount, totalRealAmount, oneMealCost }, 201);
});

export default purchases;
