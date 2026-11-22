import { useQuery } from '@tanstack/react-query';
import fetchMealStock from '../api/getMealStock';

export const useMealStock = (userId: string) => {
  const query = useQuery({
    queryKey: ['mealStock', userId],
    queryFn: fetchMealStock,
    enabled: !!userId,
  });
  const data = query.data;
  return { query, data };
};
