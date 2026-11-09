import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../../../types/bindings';
import { purchaseService } from '../services/purchaseService';
import {
  purchaseSchema,
  updatePurchaseSchema,
  deletePurchaseSchema,
} from '../schemas/purchaseSchemas';

const purchases = new Hono<{ Bindings: Bindings }>()
  .get('/', async (c) => {
    const d1 = c.env.meal_count_db;
    const allPurchases = await purchaseService.getAllPurchases(d1);
    return c.json(allPurchases, 200);
  })

  .get('/:id', zValidator('param', purchaseSchema), async (c) => {
    const d1 = c.env.meal_count_db;
    const { id } = c.req.valid('param');
    const purchase = await purchaseService.findPurchaseById(id, d1);
    if (!purchase) {
      return c.json({ error: 'Purchase not found' }, 404);
    }
    return c.json(purchase, 200);
  })

  .post('/', zValidator('json', purchaseSchema), async (c) => {
    const d1 = c.env.meal_count_db;
    const data = c.req.valid('json');
    const result = await purchaseService.createPurchase(data, d1);
    return c.json(result, 201);
  })

  .patch(
    '/:id',
    zValidator('json', updatePurchaseSchema),
    zValidator('param', purchaseSchema),
    async (c) => {
      const d1 = c.env.meal_count_db;
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');

      const result = await purchaseService.updatePurchase(id, data, d1);
      if (result.status === 'not_found') {
        return c.json({ error: 'Purchase not found' }, 404);
      }
      if (result.status === 'meal_stock_not_found') {
        return c.json({ error: 'Meal stock not found' }, 404);
      }
      if (result.status === 'version_conflict') {
        return c.json({ error: 'Purchase version conflict' }, 409);
      }
      return c.json({ status: 'ok', afterPurchase: result });
    }
  )

  .delete('/:id', zValidator('query', deletePurchaseSchema), async (c) => {
    const d1 = c.env.meal_count_db;
    const { id, version } = c.req.valid('query');
    const result = await purchaseService.deletePurchase(id, version, d1);
    if (result.status === 'not_found') {
      return c.json({ error: 'Purchase not found' }, 404);
    }
    if (result.status === 'version_conflict') {
      return c.json({ error: 'Purchase version conflict' }, 409);
    }
    return c.body(null, 204);
  });
export default purchases;
