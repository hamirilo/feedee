repo: hamirilo/feedee
branch: main

## Last sync

date: 2026-08-16T11:32:00Z

### Updated in this project

- 現行 UI（一覧 / 詳細リーダー / フィード別 / ブックマーク / サイドバー）を Django テンプレートから再現
- リデザイン案 3 方向（トリアージ / マガジン / セッション）を hamirilo-ui で作成
- static/placeholder.svg・favicon.svg をリポジトリから取り込み
- ブックマーク案（ボード / ギャラリー / 2ペイン / Booky 型パネル）と統合案（ビュー切替＋右パネル＋一括操作）
- 共通シェル（64px レール＋文脈サイドバー＋共通ヘッダー）と設定画面のリデザイン

## Screen map

| プロジェクト画面 | 参照した repo ファイル |
| --- | --- |
| Feedee 現行UI再現 — 記事一覧 | templates/rss/feeds_page.html, templates/rss/_article_card.html, templates/base.html, templates/includes/_pagination.html |
| Feedee 現行UI再現 — 密度（compact / list） | templates/rss/_article_card.html |
| Feedee 現行UI再現 — フィード別記事一覧 | templates/rss/feed_articles.html |
| Feedee 現行UI再現 — 記事リーダー | templates/rss/reader_view.html, static/css/article-prose.css |
| Feedee 現行UI再現 — ブックマーク一覧 | templates/bookmarks/bookmarks_page.html, templates/base.html |
| 共通トークン（色・影・フォント） | tailwind.config.js, frontend/css/main.css |
| Feedee リデザイン案 1a/1b/1c | 上記すべて（情報構造の出典） |
| リデザイン案 2a/2b/2c/3a/4a/4b（ブックマーク） | templates/bookmarks/bookmarks_page.html, templates/rss/settings_bookmarks.html |
| リデザイン案 5a（共通シェル） | templates/base.html, templates/includes/_main_nav.html |
| リデザイン案 5b（設定） | templates/rss/settings_account.html, templates/rss/settings_rss.html, templates/rss/settings_bookmarks.html |

## 未着手

- templates/rss/settings.html（旧・単一ページ版）と feed_settings.html は未参照
- 現行 UI 再現ファイル側に設定画面は未追加（リデザイン案 5b のみ）
