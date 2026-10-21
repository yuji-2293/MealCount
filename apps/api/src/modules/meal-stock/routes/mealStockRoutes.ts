import { Hono } from 'hono';
import { mealStockServices } from '../services/mealStockServices';
import type { Bindings } from '../../../types/bindings';

const mealStock = new Hono<{ Bindings: Bindings }>().get('/:id', async (c) => {
  const d1 = c.env.meal_count_db;
  const { id } = c.req.param();
  const mealStockData = await mealStockServices.getMealStockById(d1, Number(id));
  console.log(`mealStock ${id}:`, mealStockData);
  return c.json(mealStockData);
});
export default mealStock;
