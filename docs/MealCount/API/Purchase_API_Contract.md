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


## Purchase

### 作成
MealCountのドメインルール  
├ 食費合計 = ① + ② + ③  
├ 実質食費 = ① + ②  
└ 1食単価 = 実質食費 ÷ 仕入れ食数   

```
[Request]
Method: POST
URL:  /purchases
body:
{
  [ユーザーが入力して送る]
  購入日,
  即日消費の合計金額(1),
  計画消費の合計金額(2),
  各月消費の合計金額(3),
  仕入れ食数,
}

[Response]

Status:
201 Created

body:
{
  id,
  購入日,
  即日消費の合計金額(1),
  計画消費の合計金額(2),
  各月消費の合計金額(3),
  仕入れ食数,
  -----ここからバックエンドが計算して返す-----
  食費合計金額,
  実質食費合計金額,
  １食単価
}

[Error]
400 Bad Request
{
  error: 'Invalid request'
}
```
---

### 取得
```
[Request]
Method: GET
URL:  /purchases

[Response]

Status:
200 OK

body:
[
  {
    id,
    購入日,
    即日消費の合計金額,
    計画消費の合計金額,
    各月消費の合計金額,
    仕入れ食数,
    食費合計金額,
    実質食費合計金額,
    1食単価
  }
]
```

---

### 詳細
```
[Request]
  Method: GET
  URL:  /purchases/:id
  body:

  [Response]

  Status:
  200 OK

  body:
  {
    id,
    購入日,
    即日消費の合計金額,
    計画消費の合計金額,
    各月消費の合計金額,
    仕入れ食数,
    食費合計金額,
    実質食費合計金額,
    1食単価
  }

  [Error]
  404 Not Found
  {
    error: 'Purchase not found'
  }
```

---

### 更新
```
[Request]
  Method: PATCH
  URL:  /purchases/:id
  body:
  {
    購入日,
    即日消費の合計金額,
    計画消費の合計金額,
    各月消費の合計金額,
    仕入れ食数
    以上、変更の必要がある項目に対して送信可能
  }

  [Response]

  Status:
  200 OK

  body:
  {
    更新後のpurchase全体を返却する
  }

  [Error]
  400 Bad Request
    {
      "error": "Invalid request"
    }
  404 Not Found
    {
      error: 'purchase not found'
    }
```

---

### 削除
```
[Request]
  Method: DELETE
  URL:  /purchases/:id

  [Response]

  Status:
  204 No Content

  [Error]
  404 Not Found
  {
    error: 'purchase not found'
  }
```
