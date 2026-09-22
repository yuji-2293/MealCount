# MealCountアプリのAPI契約
## 雛形
[Request]
  Method: 
  URL:  /
  body:
  {

  }

  [Response]

  Status:
  

  body:
  {

  }

  [Error]
  400 Bad Request
  {
    
  }

## Summary

### 取得
```
[Request]
  Method: GET
  URL:  /Summaries

  [Response]

  Status:
  200 OK
  

  body:
  {
    期間,
    開始日,
    終了日,
    10日間の食費合計,
    10日間の実質食費合計,
    10日間の仕入れ食数,
    10日間の終了時点の在庫食数,
    10日間の終了時点の在庫の消費予定日
  }

  [Error]
  404 Not Found
  {
    error: Summary not found
  }

```

---

## Analysis

### 取得
```
# MealCountアプリのAPI契約
## 雛形
[Request]
  Method: GET
  URL:  /analysis

  [Response]

  Status:
  200 OK

  body:
  {
    10日間の1食単価=( 10日間の実質食費合計 / 10日間の消費食数),
    月の残り必要食数={ (その月の最終日 - 現在の日数) = 残りの月数  * デフォルトの1日の消費食数 } ,
    在庫を差し引いた実際の必要食数=( 月の残り必要食数 - 現在の在庫食数 ),
    今後必要になる食費=( 10日間の1食単価 * 在庫を差し引いた実際の必要食数)
  }

  [Error]
  404 Not Found
  {
    error: Analysis not found
  }
```
