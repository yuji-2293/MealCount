## Hono RPCの型伝播

API内部で `@/*` aliasを使用していたところ、
Webから `AppType` を参照した際に型解決が崩れ、
RPC clientの一部が `any` / generic型になった。

API内部のimportを相対パスへ変更したことで、
Request / Response型まで正常に伝播した。

現状では、型共有の安定性を優先してAPI内部では相対importを使用する。
