# 実装時に使ったzodメソッドをまとめる。
## 使用したzodメソッド
- `z.number().positive().int()`: 正の整数であることを検証
- `z.number().nonnegative().int()`: 0以上の整数であることを検証
- `z.string()`: 文字列であることを検証
- `z.date()`: javascriptのDateオブジェクトであることを検証
- `z.object({...})`: オブジェクトの構造を検証
- `z.infer<typeof schema>`: スキーマから型を推論
- 
