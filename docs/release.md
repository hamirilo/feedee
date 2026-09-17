# CI とリリース

判断の正本は開発 Standard 側にある。ここには feedee 固有の差分だけを書く。

- [CI パイプライン Playbook](https://github.com/hamirilo/ai-dev-playbook/blob/main/playbooks/ci-pipeline.md)
- [リポジトリのリリース Playbook](https://github.com/hamirilo/ai-dev-playbook/blob/main/playbooks/repository-release.md)
- [Governance Standard §4.3 必須の機械的検証](https://github.com/hamirilo/ai-dev-standards/blob/main/standards/governance/README.md)

## CI (`.github/workflows/ci.yml`)

PR と `main` への push で起動する。変更検出ジョブ `changes` が対象範囲（backend / frontend / worker / image）を判定し、不要なジョブを安全にスキップする。

| ジョブ | 内容 |
| --- | --- |
| `changes` | PR の変更ファイルを判定し、各ジョブの実行要否を出力する |
| `backend` | `uv sync --frozen` / ruff / typos / migration の欠落検査 / PostgreSQL への migrate / pytest / `check --deploy` |
| `frontend` | `bun install --frozen-lockfile` (キャッシュ有効) / biome / vite build |
| `worker` | RSS 取得ワーカー (Go) の gofmt / vet / test / build |
| `image` | Docker BuildKit GHA キャッシュを使った backend と rss-worker の image build と、中身があることの確認 |
| `ci` | 上記すべての結果を集約する |

**required check に登録するのは `ci` だけにする。** ジョブ構成を変えるたびに ruleset を
直さずに済み、途中のジョブの失敗も集約ジョブから見える。ruleset へ個別のジョブ名を
登録すると、ジョブを増減させるたびに merge できなくなる。

起動条件を `on.paths` で絞らず、変更検出ジョブと `if:` で制御しているため、スキップされたジョブも成功（skipped）として集約ジョブ `ci` に正しく伝播し、PR が pending で止まることはない。

型チェックは入れていない。Python 側に mypy、フロントエンド側に TypeScript の設定が
まだ無いため、形式的にツールを足すことはしていない。どちらかを導入したらこのジョブへ加える。

### テストの DB

CI のテストと `migrate` は、実行環境と同じ **PostgreSQL** のサービスコンテナに対して走る。
`config/settings/base.py` は `DATABASE_URL` があれば PostgreSQL を使うため、CI では必ず渡す
（渡さないと SQLite にフォールバックし、実行環境と違うエンジンで検証することになる）。

以前は SQLite で走らせていた。`apps/rssapp/migrations/0019_...` が 7 つのモデルの主キーを
bigint から UUID へ変換しており、PostgreSQL には bigint → uuid の cast が無いため

```text
django.db.utils.ProgrammingError: cannot cast type bigint to uuid
```

で失敗していた（SQLite はテーブルを作り直すため通ってしまい、長く気づかれなかった）。
空の DB でも失敗するので、**新しい PostgreSQL 環境を立ち上げられない状態**だった。

`apps/rssapp/migrations/_uuid_cast.py` の `AlterFieldToUUID` が、この変換の USING 句を

```sql
ALTER COLUMN "id" TYPE uuid USING lpad(to_hex("id"), 32, '0')::uuid
```

へ差し替えて解消している。10 進の値をそのまま 16 進の UUID へ移す式で、1 対 1 で衝突せず、
主キーとそれを指す外部キーへ同じ式が当たるため、行があっても参照関係はそのまま保たれる
（`1` → `00000000-0000-0000-0000-000000000001`）。

#### 0018 以前のデータが残る DB を移行する場合の注意

0019 は主キーの変換だけでなく、`bookmark.source_article` / `bookmark.category_v2` /
`bookmark.hash` / `bookmark.normalized_url` や `feed` / `article` のいくつかの列を
**削除して作り直す**（`source_article` は 0020 で空のまま戻る）。元の migration の設計が
そうなっているため、0018 以前のデータを持つ DB へ適用するとそれらの列の中身は失われる。
また `bookmark.category` は参照先が `BookmarkCategory` から `Category` へ変わるが、値の
読み替えはしないため、同じ整数 id の別カテゴリを指すことになる。

新しい環境を作る場合と、すでに 0019 を適用済みの DB には影響しない。0018 以前のデータを
残したまま移行する必要がある場合は、この 2 点を先に決めてから行うこと。

### GitHub Packages

現在このリポジトリは `@hamirilo/*` に依存していない。`@hamirilo/ui`（Standard 上は廃止済み）と
`@hamirilo/application-ui-kit` はどちらもコードから一度も import されておらず、
GitHub Packages の read 権限が無いために CI の `bun install` が 403 で失敗していたため、
依存から外した（2026-09）。

`.npmrc` の `@hamirilo` スコープ設定と、ワークフロー / Dockerfile のトークン受け渡し
（`secrets.NPM_PACKAGES_TOKEN || secrets.GITHUB_TOKEN` と BuildKit secret）は残してある。
UI Kit を採用するときは依存を足すだけでよいが、そのときは次のどちらかが必要になる。

- パッケージ設定の "Manage Actions access" に `hamirilo/feedee` を追加する
  （**パッケージごとの設定**なので、使うパッケージすべてに付ける）
- `read:packages` を持つ PAT を Secret `NPM_PACKAGES_TOKEN` として登録する

### 版の固定

| 対象 | 正本 |
| --- | --- |
| Python 依存 | `uv.lock` (`uv sync --frozen`) |
| フロントエンド依存 | `bun.lock` (`bun install --frozen-lockfile`) |
| bun 本体 | `.bun-version` (CI は `bun-version-file` で参照する) |
| Go 本体 | `go.mod` (CI は `go-version-file` で参照する) |
| uv 本体 | ワークフローの `version:` |
| Python | `.python-version` と Docker イメージ |

uv の版だけがワークフロー側にある。`pyproject.toml` の `[tool.uv] required-version` を
正本にすると手元の uv も縛られるため、現状は CI 側で固定している。

## リリース (`.github/workflows/release-please.yml`)

`main` への push で Release Please が動き、release PR を作る / 更新する。
release PR を merge すると tag と GitHub Release が作られる。

1. PR を review して `main` へ squash merge する (PR title が commit message になる)。
2. Release Please が作った release PR で version と `CHANGELOG.md` を確認する。
3. release PR を merge すると `v<version>` の tag と GitHub Release ができる。

すべての merge で release PR を merge する必要はない。まとまった時点で公開する。

### version の決まり方

PR title の prefix で決まる。形式は `.github/workflows/pr-title.yml` が PR の時点で検査する。

| PR title | version |
| --- | --- |
| `fix:` | PATCH |
| `feat:` | MINOR |
| `!` または `BREAKING CHANGE` | MAJOR |
| `docs:` / `chore:` など | release されない |

### version の正本

リポジトリの version は `version.txt` と `.release-please-manifest.json`。
Release Please が両方を更新する。`pyproject.toml` の `version` はリリース version ではない
(publish しないため触らない)。

既存 tag は `v2.0` で SemVer の 3 桁になっていない。Release Please はこれを version として
解釈できないため、対応する `2.0.0` を開始点として `.release-please-manifest.json` へ
明示している。次のリリースは `v2.0.1` / `v2.1.0` / `v3.0.0` のいずれかになる。

ワークフローへ `release-type` 入力を渡していないのは、渡すと manifest が無視され、
開始 version が不定になるため。
tag は `v<version>` になる。`release-please-config.json` の
`include-component-in-tag: false` がこれを決めている（省略すると既定の
`<package-name>-v<version>` になり、既存の tag と形が変わる）。


### 初回に必要な GitHub 設定

`Settings → Actions → General → Workflow permissions` で次を有効にする。

- Actions が write 権限を利用できること
- `Allow GitHub Actions to create and approve pull requests`

後者が無効だと、ワークフローで `pull-requests: write` を指定していても
release PR の作成は拒否される (`GitHub Actions is not permitted to create or approve pull requests.`)。

## コンテナイメージの配布

release PR を merge して tag と Release ができた回だけ、同じ Workflow の `image` job が
リリースした commit の arm64 イメージを GHCR へ push する。

| イメージ | Dockerfile |
| --- | --- |
| `ghcr.io/hamirilo/feedee` | `Dockerfile`（Django + Vite） |
| `ghcr.io/hamirilo/feedee-rss-worker` | `rss_worker/Dockerfile`（Go） |

tag は `v<version>` と `latest` の 2 つ。**切り戻しは tag ではなく digest で指す。**
digest は Workflow の実行結果（Summary）に出る。

イベントではなく同じ Workflow の job にしているのは、`GITHUB_TOKEN` で作られた tag や
Release が別の Workflow を起動しないため（GitHub の無限ループ防止）。

このリポジトリは public なので、GitHub hosted の arm64 runner（`ubuntu-24.04-arm`）を
そのまま使える。private な favtt / hamirilog は QEMU のクロスビルドになっている。

## デプロイ

**本番はまだソースから build している。** Mac mini 上で `scripts/deploy.sh` が
`git pull` → `docker compose build` → `up -d` を実行する。

pull 運用へ切り替えるには、Mac mini で GHCR へログインし（`read:packages` のトークンで
`docker login ghcr.io`）、`compose.prod.yaml` の `backend` と `rss-worker` を `build:` から
`image:` 参照へ変え、`scripts/deploy.sh` を「pull して起動」へ書き換える。切替時の
ダウンタイムと切り戻しの確認も要るため、
[decisions/adr-0001-server-side-image-build.md](../decisions/adr-0001-server-side-image-build.md)
の解消条件を確認してから行うこと。
