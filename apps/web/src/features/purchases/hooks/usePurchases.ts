import { useQuery } from '@tanstack/react-query';
import fetchPurchases from '../api/getPurchases';

export const usePurchases = (userId: string) => {
  const query = useQuery({
    queryKey: ['purchases', userId],
    queryFn: fetchPurchases,
    enabled: !!userId,
  });

  const data = query.data?.purchases;
  return { data, query };
};
