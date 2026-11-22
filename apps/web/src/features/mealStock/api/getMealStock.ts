import client from '../../../lib/rpcClient';

export default async function getMealStock() {
  const res = await client.mealStock.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch meal stock');
  }
  return res.json();
};
