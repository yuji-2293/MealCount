import deletePurchase from '../api/deletePurchases';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeletePurchases() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
  return mutation;
}
