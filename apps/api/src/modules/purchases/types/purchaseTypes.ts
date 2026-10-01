// purchaseドメインに関する型定義

// 内部関数の計算結果に使用する型

export type CalculateAmounts = {
  sameDayAmount: number;
  plannedAmount: number;
  monthlyAmount: number;
  purchasedMealCount: number;
};

export type PurchaseAmounts = {
  totalAmount: number;
  totalRealAmount: number;
  oneMealCost: number;
};

export type Purchase = {
  id: number;
  purchaseDate: string;
  sameDayAmount: number;
  plannedAmount: number;
  monthlyAmount: number;
  purchasedMealCount: number;
  createdAt: string;
  updatedAt: string;
};
