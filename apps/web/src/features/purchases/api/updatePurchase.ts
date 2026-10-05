import client from '../../../lib/rpcClient';
import type { InferRequestType } from 'hono/client';
const $patch = client.purchases[':id'].$patch;
type UpdatePurchaseParams = InferRequestType<typeof $patch>;

export default async function updatePurchase({ json, param }: UpdatePurchaseParams) {
  const result = await $patch({
    json,
    param,
  });
  if (!result.ok) {
    throw new Error('Failed to update purchase');
  }
  return result.json();
}
