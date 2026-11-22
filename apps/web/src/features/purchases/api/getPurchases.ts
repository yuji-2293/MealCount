import client from '../../../lib/rpcClient';

export default async function fetchPurchases() {
  const res = await client.purchases.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch purchases');
  }
  return res.json();
}
