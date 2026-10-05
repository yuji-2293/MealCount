import { usePostPurchase } from '../hooks/useCreatePurchase';
import { useState } from 'react';
import { toast } from 'sonner';

export const PurchasesCreate = () => {
  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [sameDayAmount, setSameDayAmount] = useState<number>(0);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [purchasedMealCount, setPurchasedMealCount] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>('');

  const { mutate, isPending, error } = usePostPurchase();
  const handleCreatePurchase = () => {
    mutate(
      {
        plannedAmount,
        sameDayAmount,
        monthlyAmount,
        purchasedMealCount,
        purchaseDate,
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
    <div>
      <input
        type="number"
        value={plannedAmount}
        onChange={(e) => setPlannedAmount(Number(e.target.value))}
        placeholder="Planned Amount"
      />
      <input
        type="number"
        value={sameDayAmount}
        onChange={(e) => setSameDayAmount(Number(e.target.value))}
        placeholder="Same Day Amount"
      />
      <input
        type="number"
        value={monthlyAmount}
        onChange={(e) => setMonthlyAmount(Number(e.target.value))}
        placeholder="Monthly Amount"
      />
      <input
        type="number"
        value={purchasedMealCount}
        onChange={(e) => setPurchasedMealCount(Number(e.target.value))}
        placeholder="Purchased Meal Count"
      />
      <input
        type="date"
        value={purchaseDate}
        onChange={(e) => setPurchaseDate(e.target.value)}
        placeholder="Purchase Date"
      />
      <button onClick={handleCreatePurchase} disabled={isPending || !!error}>
        Create Purchase
      </button>
    </div>
  );
};
