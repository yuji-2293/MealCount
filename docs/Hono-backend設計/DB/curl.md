# curl コマンドまとめ

- GET リクエストの例
 ```zsh
curl 
  -X GET "http://example.com/api/resource" 
  -H "accept: application/json"
```
-i = レスポンスヘッダーを表示するオプション
-X = HTTPメソッドを指定するオプション (例: GET, POST, PUT, DELETE)
-H = HTTPヘッダーを指定するオプション (例: "accept: application/json")
-d = HTTPリクエストのボディを指定するオプション (例: '{"key":"value"}')

- POST リクエストの例
 ```zsh
curl 
  -X POST "http://example.com/api/resource" 
  -H "accept: application/json" 
  -H "Content-Type: application/json" 
  -d '{"key":"value"}'
```
