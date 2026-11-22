import { useCreatePurchase } from '../hooks/useCreatePurchase';
import { useState } from 'react';
import { toast } from 'sonner';

export const PurchaseCreateForm = () => {
  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [sameDayAmount, setSameDayAmount] = useState<number>(0);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [purchasedMealCount, setPurchasedMealCount] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [version, setVersion] = useState<number>(0);

  const { mutate, isPending } = useCreatePurchase();
  const handleCreatePurchase = () => {
    mutate(
      {
        plannedAmount,
        sameDayAmount,
        monthlyAmount,
        purchasedMealCount,
        purchaseDate,
        version,
      },
      {
        onSuccess: () => {
          toast.success('作成に成功しました');
        },
        onError: () => {
          toast.error('作成に失敗しました');
        },
      }
    );
  };

  return (
    <div className="my-4 mx-4 border border-amber-300 p-4">
      <input
        type="number"
        value={plannedAmount}
        onChange={(e) => setPlannedAmount(Number(e.target.value))}
        placeholder="計画消費"
      />
      <input
        type="number"
        value={sameDayAmount}
        onChange={(e) => setSameDayAmount(Number(e.target.value))}
        placeholder="当日消費"
      />
      <input
        type="number"
        value={monthlyAmount}
        onChange={(e) => setMonthlyAmount(Number(e.target.value))}
        placeholder="月間消費"
      />
      <input
        type="number"
        value={purchasedMealCount}
        onChange={(e) => setPurchasedMealCount(Number(e.target.value))}
        placeholder="購入済み食数"
      />
      <input
        type="date"
        value={purchaseDate}
        onChange={(e) => setPurchaseDate(e.target.value)}
        placeholder="購入日"
      />
      <input
        type="number"
        value={version}
        onChange={(e) => setVersion(Number(e.target.value))}
        placeholder="バージョン"
      />

      <button
        onClick={handleCreatePurchase}
        disabled={isPending}
        className="bg-amber-300 p-2 rounded"
      >
        作成
      </button>
    </div>
  );
};
