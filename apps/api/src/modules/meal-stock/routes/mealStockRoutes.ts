import { Hono } from 'hono';
import { mealStockServices } from '../services/mealStockServices';
import type { Bindings } from '../../../types/bindings';
import { mealStockSchema } from '../schemas/mealStockSchemas';
import { zValidator } from '@hono/zod-validator';

const mealStock = new Hono<{ Bindings: Bindings }>()
  .get('/:id', async (c) => {
    const d1 = c.env.meal_count_db;
    const { id } = c.req.param();
    const mealStockData = await mealStockServices.getMealStockById(d1, Number(id));
    console.log(`mealStock ${id}:`, mealStockData);
    return c.json(mealStockData);
  })
  .patch('/:id', zValidator('json', mealStockSchema), async (c) => {
    const d1 = c.env.meal_count_db;
    const { id } = c.req.param();
    const data = c.req.valid('json');
    const result = await mealStockServices.updateMealStock(d1, Number(id), data);
    if (!result) {
      return c.json({ error: 'Meal stock not found' }, 404);
    }
    return c.json(result);
  });
export default mealStock;
