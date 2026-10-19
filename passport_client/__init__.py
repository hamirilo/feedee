"""passport（hamirilo の共通ログイン）へログインを任せる OIDC クライアント。

正は hamirilo/passport の `passport_client/`。各プロダクトへはディレクトリごと
複製して置く（private リポジトリの Python パッケージを各イメージのビルドで
取りに行く仕組みを持たないため）。**直すときは passport 側を直してから配り直す。**
バージョンは `VERSION` で見分ける。

mozilla-django-oidc の上に、hamirilo の配置に合わせた次の差分だけを足す。

- 同じマシンへ LAN IP / Tailscale のどちらからも来るので、ブラウザを送る
  passport の URL はアクセス元のホスト名から組み立てる（`PASSPORT_PUBLIC_URL`）。
  トークン・userinfo・JWKS はサーバー間の固定 URL（`PASSPORT_INTERNAL_URL`）で読む
- passport が「このプロダクトを使ってよい」とした人だけを通す（`apps` claim）
- 既存のユーザーとは email でひも付け、いなければ作る
- 定期的に passport へ確かめ直し、許可の取り消し・passport でのログアウトを反映する
"""

VERSION = "1.0.0"
