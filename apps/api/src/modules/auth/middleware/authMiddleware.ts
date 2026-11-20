import { createMiddleware } from 'hono/factory';
import type { SessionUser } from '../../../../src/lib/auth';
import { createAuth } from '../../../../src/lib/auth';
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { user?: SessionUser };
}>(async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: '未認証' }, 401);
  }
  c.set('user', session?.user);
  return next();
});
