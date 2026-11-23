import { Hono } from 'hono';
import { mealStockServices } from '../services/mealStockServices';
import type { SessionUser } from '../../../../src/lib/auth';
import { getMealStockSchema, UpdateMealStockSchema } from '../schemas/mealStockSchemas';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../../auth/middleware/authMiddleware';

const mealStock = new Hono<{ Bindings: Env; Variables: { user: SessionUser } }>()
  // middleware処理 :全てのルートに対して認証ミドルウェアを適用
  .use(authMiddleware)
  .get('/', async (c) => {
    const user = c.get('user');
    const userId = user.id;
    const d1 = c.env.meal_count_db;
    const mealStockData = await mealStockServices.getMealStock(d1, userId);
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
      const user = c.get('user');
      const userId = user.id;
      const d1 = c.env.meal_count_db;
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');
      if (!data.version && data.version !== 0) {
        return c.json({ error: 'Meal stock version is required' }, 400);
      }
      const result = await mealStockServices.updateMealStock(d1, id, data, userId);
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
