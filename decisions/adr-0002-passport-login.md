# ADR-0002: ログインとアカウントを共通ログイン passport に任せる

- 日付: 2026-10-19
- 状態: 採用

## 背景

hamirilo のプロダクト（hamirilog / favtt / feedee / eigolog）はそれぞれ別にログインしていた。
feedee は email + パスワードの独自バックエンドで、**誰でもアカウントを作れる登録画面**
（`/register/`）と、パスワードから API 用 JWT を出すエンドポイント（`POST /app/auth/login`）を持っていた。
ユーザーごとに使えるプロダクトを決めるため、認証を共通の基盤
[passport](https://github.com/hamirilo/passport)（OIDC プロバイダ）へ集める（passport の ADR-0001）。

また、4 つとも同じホストの別ポートで動くのに session cookie 名が既定の `sessionid` のままで、
Cookie はポートで分かれないため、別のプロダクトへログインすると feedee のセッションが上書きされていた。

## 決定

- feedee は passport の OIDC クライアントになる（`passport_client/` は passport からの複製）
- 次を削除する。どれも passport の「使えるプロダクト」の判定を通らずに入れる経路になるため
  - ログイン画面・登録画面・ログアウト URL（`/login/` `/register/` `/logout/`）と `EmailBackend`
  - パスワードから JWT を出す `POST /app/auth/login`
  - 設定画面のパスワード変更（passport へのリンクに置き換える）
  - 既定パスワードの管理者を起動のたびに作る `create_admin_user`
- Admin のログインも passport へ回す。Admin を使う人には feedee 側で `is_staff` を付ける
- ユーザーは passport の email でひも付ける。いなければ email をユーザー名にして作る
- session cookie 名を `feedee_sessionid` にする

## 残すもの

- **DRF の Token 認証**（`/api/`）と **Worker Token**（Go の rss_worker）。機械からの呼び出しで、
  passport を通らない。DRF Token は Admin で発行・失効させる。passport で feedee の許可を外しても
  発行済みの Token は効き続けるので、外すときは Token も消す
- Ninja API（`/app/`）の JWT 検証。発行口は無くなったので、使う場合は passport 経由の
  発行口を別に設計する

## 結果

- 既存ユーザーは email が passport と同じなら、そのまま使い続けられる
- passport が止まっている間は新しくログインできない
