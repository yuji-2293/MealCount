import { usePurchases } from '../hooks/usePurchases';
import { useDeletePurchases } from '../hooks/useDeletePurchases';
import { useUpdatePurchases } from '../hooks/useUpdatePurchases';
export const PurchasesIndex = () => {
  const { purchases, query } = usePurchases();
  const { isLoading, error } = query;
  const { mutate } = useDeletePurchases();
  const { mutate: updateMutate } = useUpdatePurchases();

  const handleDelete = (id: number) => {
    mutate({
      id: String(id),
    });
  };
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}

      {purchases?.map((purchase) => (
        <div key={purchase.purchase.id}>
          <p>Purchase ID: {purchase.purchase.id}</p>
          <div>Purchase Date: {purchase.purchase.purchaseDate}</div>
          <div>Amount: {purchase.amounts.oneMealCost}</div>
          <button onClick={() => handleDelete(purchase.purchase.id)}>削除するよ</button>
        </div>
      ))}
    </div>
  );
};
