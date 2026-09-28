# TypeScriptの型についてのまとめ
## 基本型
- `number`：数値型
- `string`：文字列型
- `boolean`：真偽値型
- `any`：任意の型
- `void`：値を返さない型
- `undefined`：未定義の値
- `null`：null値
- `object`：オブジェクト型
  
## 配列型
- `Array<型>`：指定した型の配列
- `型[]`：指定した型の配列

## 関数の入力と出力
```
const calculateTotalAmount = (
  data: CreatePurchaseData
): PurchaseAmounts => {
```
(data: 型): 型 => {}

(data: 型)
↑入力の型: CreatePurchaseData
:型
↑出力の型: PurchaseAmounts 
