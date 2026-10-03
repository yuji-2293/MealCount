import type { InferRequestType } from 'hono/client';
import client from '../../../lib/rpcClient';

const $post = client.purchases.$post;
type PostPurchaseRequest = InferRequestType<typeof $post>['json'];

export default async function postPurchase(data: PostPurchaseRequest) {
  const res = await $post({
    json: data,
  });
  if (!res.ok) {
    throw new Error('Failed to post purchase');
  }
  return res.json();
}
