import { getTodayJST } from '../../../utils/date';

export const calculateEstimatedStock = (
  lastCalculatedData: string,
  currentMealStock: number,
  dailyMealCount: number
): {
  elapsedDays: number;
  estimatedStock: number;
  calculatedStock: number;
  estimatedDepletionDate: Date;
  estimatedNumber: number;
} => {
  // 現在日を取得 (JST)
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

  // 推定在庫が尽きる日を計算(現在日 + 推定在庫が尽きるまでの日数)
  const estimatedDepletionDate = new Date(lastCalculatedDate);
  estimatedDepletionDate.setDate(
    // getDate() で現在の「日」を取得  / setDate() で日を設定  / Math.ceilで切り上げて必要日数を計算
    estimatedDepletionDate.getDate() + Math.ceil(estimatedStock / dailyMealCount)
  );
  const estimatedNumber = Math.ceil(estimatedStock / dailyMealCount);

  return { elapsedDays, estimatedStock, calculatedStock, estimatedDepletionDate, estimatedNumber };
};
