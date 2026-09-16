# ADR-0001: コンテナイメージを実行環境でビルドする

**ステータス**: 暫定（解消条件つき）
**日付**: 2026-09-13

## コンテキスト

[Architecture Standard §10 コンテナと配布](https://github.com/hamirilo/ai-dev-standards/blob/main/standards/architecture/README.md#10-コンテナと配布)
は、CI で検証・作成した image を registry へ配布し、staging / production は
**同一の image を取得して起動する** ことを求めている。Standard は同時に、
「実行環境で build する必要がある場合は、その制約を project ADR へ残す」としている。

feedee の現在の運用は次のとおり。

- 本番は Mac mini (Apple Silicon / arm64) 1 台。`compose.prod.yaml` の `backend` と
  `rss-worker` は `build:` でソースから image を作る。
- `scripts/deploy.sh` が `git pull` → `docker compose build` → `up -d` を実行する。
- CI の runner は x86_64 (`ubuntu-latest`)。arm64 の image を CI で作るには
  QEMU を使うクロスビルドか arm64 runner が要る。private リポジトリでは
  GitHub hosted の arm64 runner を使えない。

CI とリリースの導入時点で、レジストリ配布への移行は次を必要とすると判断した。

- GHCR への push と、Mac mini 側の pull 用資格情報の設置
- `compose.prod.yaml` を `build:` から `image:` 参照へ変更
- `scripts/deploy.sh` を「pull して起動」へ書き換え
- 切替時のダウンタイムと、切り戻し (digest 固定) の確認

## 決定

1. 当面はコンテナイメージを **実行環境 (Mac mini) で build する**。
   リリース tag は image を配布しない。
2. CI は image を **build できることと、中身 (Vite 成果物 / rss-worker バイナリ) が
   入っていることを検証する** (`.github/workflows/ci.yml` の `image` ジョブ)。push はしない。
3. リリースは Release Please による version / `CHANGELOG.md` / tag / GitHub Release
   までを扱う ([docs/release.md](../docs/release.md))。
4. デプロイは `main` またはリリース tag のソースを Mac mini で build して行う。

## 結果

- CI が緑でも「本番と同一の成果物」を配っているとは言えない。本番の build は
  CI が検証した image とは別に作られる。
- どの成果物が動いているかは image digest ではなく、Mac mini 上の commit で特定する。
- 切り戻しは、対象 commit を checkout して build し直す操作になる。
  DB スキーマとの互換性は [コンテナ配布 Playbook](https://github.com/hamirilo/ai-dev-playbook/blob/main/playbooks/container-delivery.md)
  の順序 (expand → migrate → 切替 → contract) で担保する。

## 解消条件

次が揃った時点で、リリース時に arm64 image を GHCR へ push し、
`compose.prod.yaml` と `scripts/deploy.sh` を pull 運用へ切り替える
(backend と rss-worker の 2 つの image が対象)。

- Mac mini から GHCR へ到達でき、pull 用の最小権限トークンを安全に置ける
- arm64 image を CI で作れる (arm64 runner、または QEMU クロスビルドの実行時間が許容できる)
- 切替時のダウンタイムと切り戻し手順を本番で確認できる

移行時は本 ADR を「置き換え済み」にし、レジストリ配布を決めた ADR を新規に起こす。
