# GEMINI.md — AIエージェント向け開発オンボーディング (feedee)

このファイルは、AIエージェント（Antigravity等）が `feedee` リポジトリで自律的に行動するためのインデックスおよび前提ルール集です。

---

## 1. プロジェクト概要

`feedee` は、RSSフィードの収集・閲覧・管理を行うWebアプリケーションです。

---

## 2. 開発標準（hamirilo-platform 準拠）

本プロジェクトは、共有開発知識リポジトリ `hamirilo-platform` の設計方針に従っています。

### 開発の知識とガイドライン
- **オンボーディング**: [../ai-dev-platform/ai/ONBOARDING.md](../ai-dev-platform/ai/ONBOARDING.md)
- **開発標準**: [../ai-dev-platform/standards/](file:///Users/papa/dev/ai-dev-platform/standards/)

---

## 3. 開発時の前提セットアップと重要コマンド

AIエージェントおよび開発者は、タスクランナー `just` および標準ツールチェーンを使用します：

- **一括品質チェック**: `just check`
- **自動フォーマット**: `just fmt`
- **AIルール同期**: `just sync-platform`

---

## 4. プラットフォーム適用状況（タスク）
- [x] Phase 1: AIルールの同期 (`just sync-platform`)
- [x] Phase 2: 品質管理ツールチェーンの組み込み (`just check`)
- [x] Phase 3: セキュリティ規約・.env化
- [x] Phase 4: アプリ構造整理・@hamirilo/ui 化
