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
    if (!data.version && data.version !== 0) {
      return c.json({ error: 'Meal stock version is required' }, 400);
    }
    const result = await mealStockServices.updateMealStock(d1, Number(id), data);
    if (result.status === 'not_found') {
      return c.json({ error: 'Meal stock not found' }, 404);
    }
    if (result.status === 'conflict') {
      return c.json({ error: 'Conflict: Failed to update meal stock' }, 409);
    }
    return c.json(result);
  });
export default mealStock;
