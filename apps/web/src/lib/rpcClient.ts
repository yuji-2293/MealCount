import type { AppType } from '../../../api/src';
import { hc } from 'hono/client';

const client = hc<AppType>(import.meta.env.VITE_API_BASE_URL, {
  init: {
    credentials: 'include',
  },
});

export default client;
