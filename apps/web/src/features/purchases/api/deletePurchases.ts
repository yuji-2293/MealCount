import client from '../../../lib/rpcClient';
import type { InferRequestType } from 'hono/client';

const $delete = client.purchases[':id'].$delete;
type DeletePurchaseParams = InferRequestType<typeof $delete>['param'];

export default async function deletePurchase(params: DeletePurchaseParams) {
  const result = await $delete({
    param: params,
  });

  if (!result.ok) {
    throw new Error('Failed to delete purchase');
  }

  return result;
}
