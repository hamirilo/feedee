---
version: alpha
name: Feedee
description: Django + Go による RSS リーダー & ブックマークマネージャーのデザインシステム
colors:
  background: "#ffffff"
  foreground: "#0f172a"
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-active: "#1e40af"
  primary-foreground: "#ffffff"
  secondary: "#f8fafc"
  secondary-hover: "#f1f5f9"
  secondary-active: "#e2e8f0"
  secondary-foreground: "#334155"
  secondary-border: "#e2e8f0"
  card: "#ffffff"
  card-foreground: "#0f172a"
  popover: "#ffffff"
  popover-foreground: "#0f172a"
  muted: "#f1f5f9"
  muted-foreground: "#64748b"
  accent: "#f1f5f9"
  accent-foreground: "#0f172a"
  border: "#e2e8f0"
  input: "#e2e8f0"
  ring: "#2563eb"
  success: "#10b981"
  success-foreground: "#ffffff"
  warning: "#f59e0b"
  warning-foreground: "#ffffff"
  danger: "#ef4444"
  danger-foreground: "#ffffff"
  info: "#0284c7"
  info-foreground: "#ffffff"
typography:
  h1:
    fontFamily: Inter, "IBM Plex Sans JP", sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: Inter, "IBM Plex Sans JP", sans-serif
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
  h3:
    fontFamily: Inter, "IBM Plex Sans JP", sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Inter, "IBM Plex Sans JP", sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter, "IBM Plex Sans JP", sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  label-sm:
    fontFamily: Inter, "IBM Plex Sans JP", sans-serif
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: Inter, "IBM Plex Sans JP", sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 14px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 14px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  input-field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 32px
    padding: 0 10px
---

# Feedee

## Overview

効率的な大量記事の消化・整理を目的とした RSS リーダー & ブックマーク管理システムです。
読書体験を妨げないクリーンで高密度な情報レイアウト、視線の移動を最小限にする 3 ペイン / 2 ペイン構成、キーボードナビゲーションを最適化します。

- `@hamirilo/application-ui-kit` のトークン体系をベースとし、`Inter` と `IBM Plex Sans JP` による高精細なテキスト描画を行います。
- 高速な一覧スキャンと、記事リーダー画面での読みやすさ（可読性）のバランスを最優先します。
- `data-theme="dark"` による完全なダークモードをサポートし、長時間の読書でも目の疲労を軽減します。

## Colors

記事本文の可読性と、既読 / 未読 / お気に入りの視認性を担保するパレットを採用します。

- **Primary (`#2563eb`)**: 購読追加、一括既読、ブックマーク保存などの主操作。
- **Secondary (`#f8fafc`)**: フィルタ切り替え、フォルダ展開、補助アクション。
- **Muted (`#f1f5f9`)**: 既読記事のトーンダウン、サイドバー選択背景。
- **Success (`#10b981`)**: フィード取得完了、インポート成功。
- **Warning (`#f59e0b`)**: フィード取得遅延、重複警告。
- **Danger (`#ef4444`)**: フィード購読解除、ブックマーク削除。
- **Dark Mode**: 背景 `#090d16`、カード `#0f172a`、テキスト `#f8fafc`、ボーダー `#1e293b` のダークパレット。

## Typography

長文の読みやすさと、一覧画面でのタイトル一覧性の高さを両立します。

- **H1 (`28px` / `700`)**: リーダービューの記事タイトル。
- **H2 (`22px` / `600`)**: フィード別・カテゴリ別の見出し。
- **H3 (`18px` / `600`)**: 記事リスト内の個別記事タイトル。
- **Body-MD (`16px` / `400` / `1.6`)**: リーダービューの本文（行間 1.6 で可読性を確保）。
- **Body-SM (`14px` / `400` / `1.4`)**: 記事サマリー、メタデータ（配信元、日時）。
- **Label-SM (`13px` / `500`)**: タグバッジ、フィード件数カウント。
- **Caption (`12px` / `400`)**: URL ドメイン、タイムスタンプ。

## Layout

情報密度とスキャン速度を最大化するマルチペインレイアウトです。

- **3 ペイン構成**:
  - **左ペイン (Sidebar)**: カテゴリ・フィード一覧・未読バッジ（幅固定 240〜280px）。
  - **中央ペイン (Article List)**: 選択中フィードの記事一覧（スクロール独立、未読/既読の視覚差）。
  - **右ペイン (Reader View)**: 選択記事の本文プレビュー。
- **2 ペイン / フルスクリーン (Focus)**:
  - 記事に集中するためのリーダー専用全画面ビュー。
- **余白ルール**:
  - 記事リストのアイテム内余白: `12px` (`py-3 px-4`)
  - リーダービュー本文の最大幅: `680px` (読みやすい 1 行長)
  - ペイン間の境界線: `border-r border-border`

## Elevation & Depth

マルチペイン間の境界線（ボーダー）による分割を基本とし、過度なシャドウは使用しません。

- **標準 (`shadow-sm`)**: ドロップダウンメニュー、タグ選択ポップオーバー。
- **スクロールバー**: 6px 幅のミニマルな薄色スクロールバーを実装。

## Shapes

角丸は標準の `--radius: 0.5rem` (`8px`) を基準とします。

- **Small (`4px`)**: タグバッジ、未読数インジケーター。
- **Medium (`8px`)**: ボタン、検索入力、カード。
- **Full (`9999px`)**: ファビコン枠、円形ステータスアイコン。

## Components

| 部品 | 用途 |
|---|---|
| SearchInput | フィード・記事・ブックマークのインクリメンタル検索 |
| Badge | 未読件数カウント、ブックマークのカラフルなタグ |
| NavItem | サイドバーのフィード項目（未読アイコン、購読名、件数） |
| Table / List | 記事一覧（タイトル、配信元、投稿日時、お気に入りピン） |
| Dropdown | フィード設定、既読マーク操作、エクスポートメニュー |
| Dialog | 新規フィード追加、OPML インポート / エクスポート |

## Do's and Don'ts

### Do
- **キーボードショートカットを考慮した設計**: `j/k` での記事送り、`m` での既読切替、`s` での保存などに対応可能なフォーカス表示を用意する。
- **既読・未読のコントラストを明瞭にする**: 未読はフォント太字（600）＋鮮明テキスト、既読は muted-foreground で明確に差をつける。
- **ファビコンとサムネイルを崩さない**: フィードのファビコン（16x16）や記事サムネイルの縦横比を固定し、読み込み失敗時のフォールバックを用意する。

### Don't
- **本文領域の行長を広げすぎない**: 読書時の可読性を保つため、本文ペインの最大横幅は 700px 程度に抑える。
- **未読消化を邪魔する過剰なアニメーションを入れない**: 記事送り時のフェードインやスライドアニメーションは最小限（0.1s〜0.15s）に抑え、軽快さを保つ。
