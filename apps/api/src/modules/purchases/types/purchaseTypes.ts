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

// /GETレスポンスに使用する型
export type GetPurchaseResponse = {
  purchase: Purchase;
  amounts: PurchaseAmounts;
};

// エラー形式に使用する型
export type ErrorResponse = {
  error: string;
};

// POST error
export type PostErrorResponse = {
  error: string;
};
