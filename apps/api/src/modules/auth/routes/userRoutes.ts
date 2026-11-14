import { createAuth } from '../../../../src/lib/auth';
import { Hono } from 'hono';
import type { SessionUser } from '../../../../src/lib/auth';

const auths = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>()
  .on(['GET', 'POST'], '/api/auth/*', (c) => {
    const auth = createAuth(c.env);
    return auth.handler(c.req.raw);
  })

  .use('/api/*', async (c, next) => {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set('user', session?.user);
    return next();
  })

  .get('/api/me', (c) => {
    if (!c.get('user')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    return c.json(c.get('user'));
  });
export default auths;
