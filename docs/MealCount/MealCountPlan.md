```

① API設計
   ├─ Purchase
   ├─ 集計
   ├─ DB
   └─ API I/F
        ↓
② APIの最小実装 + Cloudflare Deploy
   └─ Cloudflare上でAPIが動くことだけ確認
        ↓
③ Web設計
   ├─ 画面
   ├─ ユーザーフロー
   ├─ データフロー
   └─ 責務分離
        ↓
④ API ↔ Web 最小疎通
   └─ Webから実環境APIを1本叩く
        ↓
⑤ CI/CD構築
   ├─ PR → CI
   └─ main → Deploy
        ↓
⑥ CI環境下で本格開発
   ├─ API
   └─ Web
        ↓
⑦ 結合・調整
        ↓
⑧ MVP完成

```


```
              【買い物】

              レシート
                  ↓
        ┌─────────────────┐
MVP →   │     手入力       │
将来 →  │   AI入力補助     │
        └─────────────────┘
                  ↓
              Purchase
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
      金額                 食数
        ↓                   ↓
   実質食費            仕入れ +N食
   1食単価                  ↓
                      1日 -3食
                           ↓
                     例外だけ修正
                           ↓
                    現在の残り食数

        ↓
   月次データ
        ↓
   Markdown生成
        ↓
     Obsidian
```
