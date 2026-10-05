import client from '../../../lib/rpcClient';
import type { InferRequestType } from 'hono/client';
const $patch = client.purchases[':id'].$patch;
type UpdatePurchaseParams = InferRequestType<typeof $patch>['json'];
type UpdatePurchaseParam = InferRequestType<typeof $patch>['param'];

type UpdatePurchaseResult = {
  data: UpdatePurchaseParams;
  param: UpdatePurchaseParam;
};

export default async function updatePurchase({ data, param }: UpdatePurchaseResult) {
  const result = await $patch({
    json: data,
    param,
  });
  if (!result.ok) {
    throw new Error('Failed to update purchase');
  }
  return result.json();
}
