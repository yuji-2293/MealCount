import { Hono } from 'hono';
import purchases from './modules/purchases/routes/purchaseRoutes';
import mealStock from './modules/meal-stock/routes/mealStockRoutes';
import auths from './modules/auth/routes/userRoutes';
import { cors } from 'hono/cors';
import type { SessionUser } from './lib/auth';

const app = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>();

app.use('*', cors());

const routes = app
  .get('/', (c) => {
    return c.json({ message: 'success' });
  })
  .route('/purchases', purchases)
  .route('/meal-stock', mealStock)
  .route('/', auths);

export type AppType = typeof routes;

export default routes;
