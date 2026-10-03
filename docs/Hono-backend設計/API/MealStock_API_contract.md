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

---

  ## MealStock

  ### 取得
```
  [Request]
  Method: GET
  URL:  /meal-stock
  body:
  {

  }

  [Response]

  Status:
  200 OK

  body:
    {
      id,
      現在の在庫食数,
      1日の消費食数,
      最終反映日
    }



  [Error]
  404 Not Found
  {
    error: 'MealStock not found'
  }
```
---

## 更新
```
[Request]
  Method: PATCH
  URL:  /meal-stock
  body:
  {
  デフォルトの食数の変更,
  在庫食数の補正値
  
  }

  [Response]

  Status:
  200 OK

  body:
  {
    id,
    現在の在庫食数,
    1日の消費食数
  }

  [Error]
  400 Bad Request
  {
    error: 'Invalid request'
  }
```
