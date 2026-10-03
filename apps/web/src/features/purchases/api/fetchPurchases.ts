import client from '../../../lib/rpcClient';

export default function fetchPurchases() {
  return async () => {
    const res = await client.purchases.$get();
    if (!res.ok) {
      throw new Error('Failed to fetch purchases');
    }

    return res.json();
  };
}
