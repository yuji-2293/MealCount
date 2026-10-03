import { useMutation } from '@tanstack/react-query';
import { postPurchase } from '../api/postPurchase';

export function usePostPurchase() {
  const mutation = useMutation({
    mutationFn: () => postPurchase(),
  });
  const result = mutation;
  console.log(result);
  return result;
}
