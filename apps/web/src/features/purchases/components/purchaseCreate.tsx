import { usePostPurchase } from '../hooks/usePostPurchase';

export const PurchaseCreate = () => {
  const postPurchase = usePostPurchase();
  const handleCreatePurchase = () => {
    postPurchase.mutate();
  };

  return (
    <div>
      <button onClick={handleCreatePurchase}>Create Purchase</button>
    </div>
  );
};
