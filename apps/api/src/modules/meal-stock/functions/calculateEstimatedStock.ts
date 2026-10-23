import { getTodayJST } from '../../../utils/date';

export const calculateEstimatedStock = (
  lastCalculatedData: string,
  currentMealStock: number,
  dailyMealCount: number
): { elapsedDays: number; estimatedStock: number; calculatedStock: number } => {
  // elapsedDays 取得処理
  const now = new Date(getTodayJST());
  const lastCalculatedDate = new Date(lastCalculatedData);
  const elapsedDays = Math.max(
    0,
    Math.floor((now.getTime() - lastCalculatedDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  // 補正用の推定在庫を返す
  const calculatedStock = currentMealStock - dailyMealCount * elapsedDays;

  // elapsedDays を考慮して推定在庫を計算
  const estimatedStock = Math.max(0, calculatedStock);

  return { elapsedDays, estimatedStock, calculatedStock };
};
