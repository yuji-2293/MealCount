import { Hono } from 'hono';
import purchases from './modules/purchases/routes/purchaseRoutes';
import type { Bindings } from './types/bindings';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

const routes = app
  .get('/', (c) => {
    return c.json({ message: 'success' });
  })
  .route('/purchases', purchases);

export type AppType = typeof routes;

export default routes;
