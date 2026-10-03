import type { AppType } from '../../../api/src';
import { hc } from 'hono/client';

const client = hc<AppType>('http://localhost:8787');

export default client;
