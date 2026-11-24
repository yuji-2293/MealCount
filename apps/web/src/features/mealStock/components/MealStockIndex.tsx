import { useMealStock } from '../hooks/useMealStock';

export const MealStockIndex = ({ userId }: { userId: string }) => {
  const { query, data } = useMealStock(userId);
  const { isLoading, isError } = query;

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading meal stock</p>}

      {data && (
        <div className="my-4 mx-4 border border-amber-300 p-4">
          <p>1日の消費食数: {data.dailyMealCount}</p>
          <p>現在の在庫: {data.currentMealStock}</p>
          <p>最終計算日: {data.lastCalculatedDate}</p>
          <p>推定在庫: {data.estimatedStock}</p>
          <p>推定在庫が尽きる日: {data.estimatedDepletionDate}</p>
        </div>
      )}
    </div>
  );
};
