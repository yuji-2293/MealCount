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
