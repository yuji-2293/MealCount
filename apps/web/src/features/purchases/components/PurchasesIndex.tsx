import { usePurchases } from '../hooks/usePurchases';

export const PurchasesIndex = () => {
  const { purchases, isLoading, error } = usePurchases();
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {purchases?.map((purchase) => (
        <div key={purchase.purchase.id}>
          <p>Purchase ID: {purchase.purchase.id}</p>
          <div>Purchase Date: {purchase.purchase.purchaseDate}</div>
          <div>Amount: {purchase.amounts.oneMealCost}</div>
        </div>
      ))}
    </div>
  );
};
