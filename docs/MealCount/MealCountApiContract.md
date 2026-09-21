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
201 Created

body:
{

}

[Error]
400 Bad Request
{
  
}


## Purchase
```
[Request]
Method: POST
URL:  /purchases
body:
{
  [ユーザーが入力して送る]
  購入日,
  即日消費の合計金額,
  計画消費の合計金額,
  各月消費の合計金額,
  仕入れ食数,
}

[Response]

Status:
201 Created

body:
{
  id,
  購入日,
  即日消費の合計金額,
  計画消費の合計金額,
  各月消費の合計金額,
  仕入れ食数,
  -----ここからバックエンドが計算して返す-----
  食費合計金額,
  実質食費合計金額,
  １食単価
}

[Error]
400 Bad Request
{

}

  GET    /purchases
  GET    /purchases/:id
  PATCH  /purchases/:id
  DELETE /purchases/:id

  
```
