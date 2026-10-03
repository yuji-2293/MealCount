import { useQuery } from '@tanstack/react-query';
import { fetchPurchases } from '../api/fetchPurchases';

export const usePurchases = () => {
  const query = useQuery({
    queryKey: ['purchases'],
    queryFn: fetchPurchases,
  });

  const purchases = query.data;

  console.log(purchases);
  return { ...query, purchases };
};
