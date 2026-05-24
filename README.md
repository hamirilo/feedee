# Feedee

Django + Go で構成された RSS リーダー & ブックマークマネージャー。

## 機能

### RSS リーダー

- フィード購読・カテゴリ分け・ドラッグ並び替え
- 記事一覧（検索・フィルタ・ページネーション）
- リーダービュー（キーボードショートカット対応）
- 記事状態管理（既読・お気に入り・あとで読む）
- 一括既読機能

### ブックマーク

- URL からメタデータ自動取得（タイトル・説明・サムネイル）
- タグ管理（カラーコード付き）
- RSS 記事からのブックマーク作成

### 設定

- フィード管理・タグ管理・アカウント設定を統合 Settings ページで管理
- ユーザーごとの表示設定（ソート順・ページあたり件数）

### インフラ

- Go ワーカーによる並行 RSS フェッチ（バッチ内重複排除・リトライ付き）
- Token ベース API 認証（ワーカー ↔ Django 間）
- 本番環境: Nginx + Gunicorn + PostgreSQL（Docker Compose）
- 開発環境: SQLite + Django runserver（Docker Compose）

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Django 5.2 / Django REST Framework 3.17 |
| フロントエンド | Django テンプレート / Tailwind CSS (CDN) |
| RSS ワーカー | Go 1.22 |
| DB（開発） | SQLite |
| DB（本番） | PostgreSQL 16 |
| Web サーバー | Nginx 1.27 + Gunicorn |
| パッケージ管理 | uv (Python) / Go modules |
| HTML サニタイズ | nh3 (Rust ベース) |

## プロジェクト構成

```
config/              Django 設定・URL ルート
  settings/
    base.py          共通設定
    development.py   開発環境設定
    production.py    本番環境設定
apps/rssapp/         メインアプリケーション
  models.py          Feed, Article, ArticleUserState, UserProfile, Tag, Bookmark
  views.py           Web ビュー + API ビュー
  serializers.py     DRF シリアライザ
  forms.py           Django フォーム
  urls.py            Web URL ルーティング
  api_urls.py        API URL ルーティング
  utils.py           URL 正規化・ハッシュ生成・メタデータ取得
  context_processors.py  サイドバー用コンテキスト
apps/rss_service/    RSS 機能の分離サービス層（段階移行）
  public_urls.py     既存URL互換を保つ RSS ルーティング
  public_api_urls.py 既存API互換を保つ RSS API ルーティング
  urls.py            名前空間付き RSS ルーティング（/rss/*）
  api_urls.py        名前空間付き RSS API ルーティング（/api/rss/*）
apps/bookmark_service/ Bookmark 機能の分離サービス層（段階移行）
  public_urls.py       既存URL互換を保つ Bookmark ルーティング
  public_api_urls.py   既存API互換を保つ Bookmark API ルーティング
  urls.py              名前空間付き Bookmark ルーティング（/bookmark-service/*）
  api_urls.py          名前空間付き Bookmark API ルーティング（/api/bookmarks/*）
templates/           HTML テンプレート
  base.html          レイアウト（サイドバー・ヘッダー）
  rss/               RSS 関連画面
  bookmarks/         ブックマーク関連画面
static/css/          カスタム CSS
rss_worker/          Go RSS ワーカー
  main.go            エントリーポイント
  Dockerfile         ワーカー用 Docker イメージ
docker/
  entrypoint.sh      本番起動スクリプト
  nginx.conf         Nginx 設定
```

## セットアップ

### 開発環境（ローカル）

```bash
# 依存関係インストール
uv sync

# DB マイグレーション
uv run python manage.py migrate

# スーパーユーザー作成
uv run python manage.py createsuperuser

# Django 起動
uv run python manage.py runserver

# RSS ワーカー起動（別ターミナル）
go run rss_worker/main.go
```

### 開発環境（Docker）

```bash
just dev-bg    # バックグラウンド起動
just dev-logs  # ログ確認
just dev-down  # 停止
```

### 本番環境（Docker）

```bash
# .env ファイルを作成（必須項目）
cp .env.example .env
# DJANGO_SECRET_KEY, POSTGRES_PASSWORD, WORKER_API_TOKEN を設定

just prod-up       # 起動
just prod-migrate  # マイグレーション
just prod-logs     # ログ確認
```


## API エンドポイント

すべての API は Token 認証が必要（`Authorization: Token <token>`）。

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/api/feeds/` | アクティブなフィード一覧 |
| `POST` | `/api/feeds/reorder/` | フィード並び順更新 |
| `POST` | `/api/articles/ingest/` | 記事取り込み（ワーカー用） |
| `GET/PATCH` | `/api/articles/<id>/state/` | 記事のユーザー状態取得・更新 |
| `POST` | `/api/bookmarks/fetch-metadata/` | URL メタデータ取得 |

### 分離サービス用 API エンドポイント（新規）

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/api/rss/feeds/` | RSS サービス名前空間でのフィード一覧 |
| `POST` | `/api/rss/articles/ingest/` | RSS サービス名前空間での記事取り込み |
| `GET/PATCH` | `/api/rss/articles/<id>/state/` | RSS サービス名前空間での記事状態 |
| `POST` | `/api/bookmarks/bookmarks/fetch-metadata/` | Bookmark サービス名前空間でのメタデータ取得 |
| `POST` | `/api/bookmarks/bookmarklet/create/` | Bookmark サービス名前空間でのブックマークレット登録 |

## Web ページ

| パス | 説明 |
|------|------|
| `/` | ダッシュボード（全記事一覧） |
| `/feeds/<id>/` | フィード別記事一覧 |
| `/articles/<id>/reader/` | 記事リーダー |
| `/bookmarks/` | ブックマーク一覧 |
| `/bookmarks/add/` | ブックマーク追加 |
| `/settings/` | 設定（Feeds タブ） |
| `/settings/tags/` | 設定（Tags タブ） |
| `/settings/account/` | 設定（Account タブ） |

### 分離サービス用 Web ルート（新規）

| パス | 説明 |
|------|------|
| `/rss/feeds/` | RSS サービス名前空間での記事一覧 |
| `/rss/feeds/<id>/` | RSS サービス名前空間でのフィード記事 |
| `/rss/articles/<id>/reader/` | RSS サービス名前空間での記事リーダー |
| `/bookmark-service/bookmarks/` | Bookmark サービス名前空間でのブックマーク一覧 |

## サービス分離の現状

- 既存ルート（`/feeds/*`, `/bookmarks/*`, `/api/*`）は互換維持のため有効です。
- 既存ルートは内部的に `apps/rss_service` と `apps/bookmark_service` のルーティングへ委譲されています。
- これにより、機能別 app を別 Django プロジェクトに移植しやすい構造へ移行済みです。

## 環境変数

### Django

| 変数名 | デフォルト | 説明 |
|--------|-----------|------|
| `DJANGO_SECRET_KEY` | (開発用キー) | Secret key（本番では必ず変更） |
| `DJANGO_DEBUG` | `True` | デバッグモード |
| `DJANGO_ALLOWED_HOSTS` | `*` | 許可ホスト（カンマ区切り） |
| `DJANGO_SETTINGS_MODULE` | — | 設定モジュールパス |

### 本番のみ

| 変数名 | デフォルト | 説明 |
|--------|-----------|------|
| `POSTGRES_DB` | `feedee` | DB 名 |
| `POSTGRES_USER` | `feedee` | DB ユーザー |
| `POSTGRES_PASSWORD` | (必須) | DB パスワード |
| `GUNICORN_WORKERS` | `3` | Gunicorn ワーカー数 |
| `NGINX_PORT` | `80` | Nginx ポート |

### RSS ワーカー

| 変数名 | デフォルト | 説明 |
|--------|-----------|------|
| `DJANGO_BASE_URL` | `http://127.0.0.1:8000` | Django API の URL |
| `WORKER_API_TOKEN` | — | API 認証トークン（本番では必須） |
| `HTTP_TIMEOUT_SECONDS` | `15` | HTTP タイムアウト（秒） |
| `MAX_CONCURRENCY` | `8` | 並行フェッチ数 |
| `INGEST_MAX_RETRY` | `3` | 取り込みリトライ回数 |
| `INGEST_INITIAL_BACKOFF_SECONDS` | `1` | リトライ初期待機時間（秒） |

## Just コマンド

```
just dev                 開発環境起動（フォアグラウンド）
just dev-bg              開発環境起動（バックグラウンド）
just dev-down            開発環境停止
just dev-logs            開発ログ表示
just dev-build           開発環境ビルド

just prod-up             本番環境起動（バックグラウンド）
just prod-down           本番環境停止
just prod-logs           本番ログ表示
just prod-build          本番環境ビルド
just prod-migrate        本番マイグレーション実行
just prod-shell          本番 Django シェル

just local-migrate       ローカル DB マイグレーション
just local-shell         ローカル Django シェル
just local-worker        ローカル RSS ワーカー起動
just local-superuser     ローカル スーパーユーザー作成
just local-collectstatic ローカル 静的ファイル収集

just test                テスト実行
just lint                コードチェック（ruff）
just fmt                 コードフォーマット（ruff）
just clean               キャッシュ・ビルド生成物削除

just backup-dev          開発 DB バックアップ
just backup-prod         本番 DB バックアップ
just restore-dev         開発 DB リストア
just restore-prod        本番 DB リストア
just list-backups        バックアップ一覧表示
just git-safe-purge      Git 履歴から指定パスを安全に削除
```

