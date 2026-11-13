import { betterAuth } from 'better-auth';

export const createAuth = (env: Env) =>
  betterAuth({
    database: env.meal_count_db,
    emailAndPassword: {
      enabled: true,
    },
    secrets: [{ version: 1, value: env.BETTER_AUTH_SECRET }],

    baseURL: {
      allowedHosts: ['localhost:8787', '127.0.0.1:8787', '127.0.0.1/*'],
    },
    protocol: 'auto',
    url: env.BETTER_AUTH_URL,
  });

export type AuthInstance = ReturnType<typeof createAuth>;
export type SessionUser = AuthInstance[`$Infer`]['Session']['user'];
