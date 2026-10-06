import { useMutation, useQueryClient } from '@tanstack/react-query';
import postPurchase from '../api/createPurchase';

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: postPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
  return { ...mutation };
}
