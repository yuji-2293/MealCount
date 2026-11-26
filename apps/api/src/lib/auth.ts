import { betterAuth } from 'better-auth';

export const createAuth = (env: Env) =>
  betterAuth({
    database: env.meal_count_db,
    emailAndPassword: {
      enabled: true,
    },
    secrets: [{ version: 1, value: env.BETTER_AUTH_SECRET }],

    baseURL: {
      allowedHosts: ['localhost:8787', 'api.mealcount-workersdev.workers.dev'],
    },
    protocol: 'auto',
    url: env.BETTER_AUTH_URL,
    trustedOrigins: ['http://localhost:5173', 'https://mealcount-web.pages.dev'],
  });

export type AuthInstance = ReturnType<typeof createAuth>;
export type SessionUser = AuthInstance[`$Infer`]['Session']['user'];
