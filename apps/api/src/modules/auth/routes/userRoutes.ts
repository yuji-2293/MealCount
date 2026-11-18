import { createAuth } from '../../../../src/lib/auth';
import { Hono } from 'hono';
import type { SessionUser } from '../../../../src/lib/auth';

const auths = new Hono<{ Bindings: Env; Variables: { user?: SessionUser } }>()
  // authルート処理
  .on(['GET', 'POST'], '/api/auth/*', (c) => {
    const auth = createAuth(c.env);
    return auth.handler(c.req.raw);
  })
  // Middleware 処理
  .use('/api/authorization/*', async (c, next) => {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('user', session?.user);
    return next();
  })

  // ユーザー情報取得ルート
  .get('/api/authorization/me', (c) => {
    return c.json(c.get('user'));
  });
export default auths;
