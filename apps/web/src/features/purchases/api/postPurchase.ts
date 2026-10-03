import client from '../../../lib/rpcClient';

export const postPurchase = async () => {
  return client.purchases.$post({
    json: {
      purchasedMealCount: 10,
      sameDayAmount: 10,
      plannedAmount: 10,
      monthlyAmount: 10,
      purchaseDate: '2026-10-03',
    },
  });
};
