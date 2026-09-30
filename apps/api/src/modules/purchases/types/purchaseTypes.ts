// purchaseドメインに関する型定義

// 内部関数の計算結果に使用する型

export type CalculateAmounts = {
  purchaseDate: string;
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

export type ReturnCalculatedAmounts = {
  calculated: CalculateAmounts;
  amounts: PurchaseAmounts;
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

// /GETレスポンスに使用する型
export type GetPurchaseResponse = {
  purchase: Purchase;
  amounts: PurchaseAmounts;
};
