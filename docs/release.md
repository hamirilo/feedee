# CI とリリース

判断の正本は開発 Standard 側にある。ここには feedee 固有の差分だけを書く。

- [CI パイプライン Playbook](https://github.com/hamirilo/ai-dev-playbook/blob/main/playbooks/ci-pipeline.md)
- [リポジトリのリリース Playbook](https://github.com/hamirilo/ai-dev-playbook/blob/main/playbooks/repository-release.md)
- [Governance Standard §4.3 必須の機械的検証](https://github.com/hamirilo/ai-dev-standards/blob/main/standards/governance/README.md)

## CI (`.github/workflows/ci.yml`)

PR と `main` への push で起動する。ジョブは 5 つ。

| ジョブ | 内容 |
| --- | --- |
| `backend` | `uv sync --frozen` / ruff / typos / migration の欠落検査 / pytest / `check --deploy` |
| `frontend` | `bun install --frozen-lockfile` / biome / vite build |
| `worker` | RSS 取得ワーカー (Go) の gofmt / vet / test / build |
| `image` | backend と rss-worker の image build と、中身があることの確認 |
| `ci` | 上記 4 つの結果を集約する |

**required check に登録するのは `ci` だけにする。** ジョブ構成を変えるたびに ruleset を
直さずに済み、途中のジョブの失敗も集約ジョブから見える。ruleset へ個別のジョブ名を
登録すると、ジョブを増減させるたびに merge できなくなる。

起動条件を `on.paths` で絞っていない。絞ったまま required check にすると、対象外の PR で
check が永久に pending になり merge できなくなる。

型チェックは入れていない。Python 側に mypy、フロントエンド側に TypeScript の設定が
まだ無いため、形式的にツールを足すことはしていない。どちらかを導入したらこのジョブへ加える。

### テストの DB（既知の穴）

CI のテストは **SQLite** で走る。実行環境は PostgreSQL なので、本来は実行環境と同じ
エンジンで migrate とテストを実行すべきだが、現在は次の理由でできない。

`apps/rssapp/migrations/0019_readingitem_somedayitem_subscription_and_more.py` が
Article をはじめ 7 つのモデルの主キーを bigint から UUID へ `AlterField` で変換している。
PostgreSQL ではこれが

```text
django.db.utils.ProgrammingError: cannot cast type bigint to uuid
LINE 1: ...rssapp_article" ALTER COLUMN "id" TYPE uuid USING "id"::uuid
```

で失敗する。SQLite はテーブルを作り直すため通ってしまい、これまで気づかれていなかった。
**空の DB でも失敗する**ため、PostgreSQL では migration を最初から適用できない
（新しい環境を立ち上げられない、という本番側の問題でもある）。

直し方は主キーの変換を PostgreSQL でも適用できる形にすること（既存行の id を
どう引き継ぐか、参照している外部キーをどう合わせるかを決める必要があるため、
本番 DB の現状を確認してから行う）。直したら次を CI へ戻す。

1. `backend` ジョブへ `postgres:16-alpine` のサービスコンテナを足す
2. `DATABASE_URL` を渡す（`config/settings/base.py` は これがあれば PostgreSQL を使う）
3. `manage.py migrate` のステップを `pytest` の前に置く

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

## デプロイ

リリース tag はコンテナイメージを配布しない。本番は Mac mini 上で
`scripts/deploy.sh` がソースから build する運用のまま。
制約と解消条件は [decisions/adr-0001-server-side-image-build.md](../decisions/adr-0001-server-side-image-build.md) を参照。
