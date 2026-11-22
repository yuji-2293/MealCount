import { usePurchases } from '../hooks/usePurchases';
import { useDeletePurchase } from '../hooks/useDeletePurchase';
import { useUpdatePurchase } from '../hooks/useUpdatePurchase';
import { useState } from 'react';
import fetchPurchases from '../api/getPurchases';
import { toast } from 'sonner';

export const PurchasesIndex = ({ userId }: { userId: string }) => {
  const { data, query } = usePurchases(userId);
  const { isLoading, error } = query;
  const { mutate, isPending: isDeletePending } = useDeletePurchase();
  const { mutate: updateMutate, isPending: isUpdatePending } = useUpdatePurchase();

  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [sameDayAmount, setSameDayAmount] = useState<number>(0);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [purchasedMealCount, setPurchasedMealCount] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [editId, setEditId] = useState<number | null>(null);
  const [version, setVersion] = useState<number>(0);

  // /GET api関数のfetchPurchasesの戻り値の型を取得するための型定義
  type PurchaseItem = Awaited<ReturnType<typeof fetchPurchases>>['purchases'][number];
  // 編集対象のdataに対してPurchaseItemを型として、handleEdit関数の引数に型を付与している。
  const handleEdit = (purchase: PurchaseItem) => {
    setEditId(purchase.id);
    setPlannedAmount(purchase.plannedAmount);
    setSameDayAmount(purchase.sameDayAmount);
    setMonthlyAmount(purchase.monthlyAmount);
    setPurchasedMealCount(purchase.purchasedMealCount);
    setPurchaseDate(purchase.purchaseDate);
    setVersion(purchase.version);
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
          version,
        },
        param: {
          id: id,
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

  const handleDelete = (id: number, version: number) => {
    mutate(
      {
        id: id,
        version: version,
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
      {isUpdatePending && <p>Updating...</p>}
      {error && <p>Error: {error.message}</p>}

      {data?.map((purchase) => (
        <div key={purchase.id}>
          <p>Version: {purchase.version}</p>
          <div className="plannedAmount CRUD">
            <p>計画消費: {purchase.plannedAmount}</p>
            <p>当日消費: {purchase.sameDayAmount}</p>
            <p>月間消費: {purchase.monthlyAmount}</p>
            <p>購入済み食数: {purchase.purchasedMealCount}</p>
            <p>合計金額: {purchase.amounts.totalAmount}</p>
            <p>実質合計金額: {purchase.amounts.totalRealAmount}</p>
            <p>一食あたりの金額: {purchase.amounts.oneMealCost}</p>
            <p>購入日: {purchase.purchaseDate}</p>

            <div className="buttons">
              <button onClick={() => handleEdit(purchase)}>edit</button>
              <button
                onClick={() => handleDelete(purchase.id, purchase.version)}
                disabled={isDeletePending}
              >
                削除するよ
              </button>
            </div>
            {editId === purchase.id && (
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
                <button onClick={() => handleUpdate(purchase.id)} disabled={isUpdatePending}>
                  更新するよ
                </button>
              </div>
            )}
          </div>
        </div>
      )) || <p>No purchases found.</p>}
    </div>
  );
};
