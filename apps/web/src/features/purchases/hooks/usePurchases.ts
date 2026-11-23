import { useQuery } from '@tanstack/react-query';
import getPurchases from '../api/getPurchases';

export const usePurchases = (userId: string) => {
  const query = useQuery({
    queryKey: ['purchases', userId],
    queryFn: getPurchases,
    enabled: !!userId,
  });

  const data = query.data?.purchases;
  return { data, query };
};
