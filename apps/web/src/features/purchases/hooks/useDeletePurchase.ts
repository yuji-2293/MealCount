import deletePurchase from '../api/deletePurchase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
  return mutation;
}
