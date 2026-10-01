import { Hono } from 'hono';
import purchases from '@/modules/purchases/routes/purchaseRoutes';
import type { Bindings } from '@/types/bindings';

const app = new Hono<{ Bindings: Bindings }>();
app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' });
});

app.route('/purchases', purchases);

export default app;
