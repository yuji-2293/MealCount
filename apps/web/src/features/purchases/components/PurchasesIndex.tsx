import { usePurchases } from '../hooks/usePurchases';
import { useDeletePurchases } from '../hooks/useDeletePurchases';
import { useUpdatePurchases } from '../hooks/useUpdatePurchases';
import { useState } from 'react';
import fetchPurchases from '../api/fetchPurchases';
import { toast } from 'sonner';

export const PurchasesIndex = () => {
  const { purchases, query } = usePurchases();
  const { isLoading, error, isPending } = query;
  const { mutate } = useDeletePurchases();
  const { mutate: updateMutate } = useUpdatePurchases();

  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [sameDayAmount, setSameDayAmount] = useState<number>(0);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [purchasedMealCount, setPurchasedMealCount] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [editId, setEditId] = useState<number | null>(null);

  // /GET api関数のfetchPurchasesの戻り値の型を取得するための型定義
  type PurchaseItem = Awaited<ReturnType<typeof fetchPurchases>>[number];
  // 編集対象のdataに対してPurchaseItemを型として、handleEdit関数の引数に型を付与している。
  const handleEdit = (purchase: PurchaseItem) => {
    setEditId(purchase.purchase.id);
    setPlannedAmount(purchase.purchase.plannedAmount);
    setSameDayAmount(purchase.purchase.sameDayAmount);
    setMonthlyAmount(purchase.purchase.monthlyAmount);
    setPurchasedMealCount(purchase.purchase.purchasedMealCount);
    setPurchaseDate(purchase.purchase.purchaseDate);
  };

  const handleUpdate = (id: number) => {
    updateMutate(
      {
        json: {
          plannedAmount,
          sameDayAmount,
          monthlyAmount,
          purchasedMealCount,
          purchaseDate,
        },
        param: {
          id: String(id),
        },
      },
      {
        onSuccess: () => {
          setEditId(null);
          toast.success('更新に成功しました');
        },
        onError: () => {
          toast.error('更新に失敗しました');
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    mutate(
      {
        id: String(id),
      },
      {
        onSuccess: () => {
          toast.success('削除に成功しました');
        },
        onError: () => {
          toast.error('削除に失敗しました');
        },
      }
    );
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {isPending && <p>Updating...</p>}
      {error && <p>Error: {error.message}</p>}

      {purchases?.map((purchase) => (
        <div key={purchase.purchase.id}>
          <p>Purchase ID: {purchase.purchase.id}</p>
          <div className="plannedAmount CRUD">
            <p>planed Amount: {purchase.purchase.plannedAmount}</p>
            <p>same Day Amount: {purchase.purchase.sameDayAmount}</p>
            <p>monthly Amount: {purchase.purchase.monthlyAmount}</p>
            <p>purchased Meal Count: {purchase.purchase.purchasedMealCount}</p>
            <p>purchase Date: {purchase.purchase.purchaseDate}</p>
            <div className="buttons">
              <button onClick={() => handleEdit(purchase)}>edit</button>
              <button onClick={() => handleDelete(purchase.purchase.id)} disabled={isPending}>
                削除するよ
              </button>
            </div>
            {editId === purchase.purchase.id && (
              <div className="edit-fields">
                <input
                  type="number"
                  value={plannedAmount}
                  onChange={(e) => setPlannedAmount(Number(e.target.value))}
                />
                <input
                  type="number"
                  value={sameDayAmount}
                  onChange={(e) => setSameDayAmount(Number(e.target.value))}
                />
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                />
                <input
                  type="number"
                  value={purchasedMealCount}
                  onChange={(e) => setPurchasedMealCount(Number(e.target.value))}
                />
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
                <button onClick={() => handleUpdate(purchase.purchase.id)} disabled={isPending}>
                  更新するよ
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
