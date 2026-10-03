import type { AppType } from '../../../api/src';
import { hc } from 'hono/client';

const client = hc<AppType>(import.meta.env.API_BASE_URL);

export default client;
