import updatePurchase from '../api/updatePurchase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdatePurchases() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updatePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
  return mutation;
}
