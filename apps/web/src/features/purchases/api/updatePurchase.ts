import client from '../../../lib/rpcClient';
import type { InferRequestType } from 'hono/client';
const $patch = client.purchases[':id'].$patch;
type updatePurchaseRequest = InferRequestType<typeof $patch>;
type UpdatePurchaseParams = {
  json: updatePurchaseRequest['json'];
  param: {
    id: number;
  };
};

export default async function updatePurchase({ json, param }: UpdatePurchaseParams) {
  const Id = String(param.id);
  const result = await $patch({
    json,
    param: {
      id: Id,
    },
  });
  if (!result.ok) {
    throw new Error('Failed to update purchase');
  }
  return result.json();
}
