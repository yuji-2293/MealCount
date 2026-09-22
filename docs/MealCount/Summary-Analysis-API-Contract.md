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
    10日間の食費合計,
    10日間の実質食費合計,
    10日間の仕入れ食数,
    現在の在庫食数,
    在庫の消費予定日
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
```
