import { Hono } from 'hono';
import { mealStockServices } from '../services/mealStockServices';
import type { Bindings } from '../../../types/bindings';
import { getMealStockSchema, UpdateMealStockSchema } from '../schemas/mealStockSchemas';
import { zValidator } from '@hono/zod-validator';

const mealStock = new Hono<{ Bindings: Bindings }>()
  .get('/:id', zValidator('param', getMealStockSchema), async (c) => {
    const d1 = c.env.meal_count_db;
    const { id } = c.req.valid('param');
    const mealStockData = await mealStockServices.getMealStockById(d1, id);
    if (mealStockData.status === 'not_found') {
      return c.json({ error: 'Meal stock not found' }, 404);
    }
    return c.json(mealStockData);
  })
  .patch(
    '/:id',
    zValidator('json', UpdateMealStockSchema),
    zValidator('param', getMealStockSchema),
    async (c) => {
      const d1 = c.env.meal_count_db;
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');
      if (!data.version && data.version !== 0) {
        return c.json({ error: 'Meal stock version is required' }, 400);
      }
      const result = await mealStockServices.updateMealStock(d1, id, data);
      if (result.status === 'not_found') {
        return c.json({ error: 'Meal stock not found' }, 404);
      }
      if (result.status === 'conflict') {
        return c.json({ error: 'Conflict: Failed to update meal stock' }, 409);
      }
      return c.json(result);
    }
  );
export default mealStock;
