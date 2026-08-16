# ai-dev-standards 準拠性レビュー結果 (feedee)

- **対象リポジトリ**: `feedee`
- **レビュー実施日**: 2026-08-16
- **準拠基準**: `ai-dev-standards` (commit: main)
- **総合評価**: **B- (要対応項目あり)**

---

## 1. 総合サマリー

`feedee` は `uv` / `bun` の利用や `Justfile` による品質管理ツールチェーン (`Ruff` / `Biome` / `pytest`) が導入されていますが、旧共有構成（`hamirilo-platform`）への参照や設定の残存、`decisions/project-context.md` の未作成、および一部アーキテクチャ規約（DRF使用）との差分が存在します。

---

## 2. カテゴリ別評価詳細

| カテゴリ | 適合状況 | 判定 | 備考 |
|---|---|:---:|---|
| **1. ガバナンス & AI設定** | `GEMINI.md` に存在しない `hamirilo-platform/ai/ONBOARDING.md` への古いリンクが存在。<br>`CLAUDE.md` / `AGENTS.md` が未配置。<br>`decisions/` ディレクトリおよび `project-context.md` が未作成。 | **要対応** | `ai-dev-standards/ai/ONBOARDING.md` への参照更新と `decisions/project-context.md` 作成が必要 |
| **2. バックエンド & アーキテクチャ** | Python 3.13, `uv` (`uv.lock`), PostgreSQL (Docker Compose)<br>`djangorestframework` (DRF) が依存に含まれている。<br>`pyjwt`, `passlib` が依存に含まれている。<br>`pyproject.toml` の `tool.ruff.extend` が存在しない `hamirilo-platform` 設定を参照。 | **一部要対応** | API は `django-ninja` への統一が原則。DRF の新規追加は非推奨。<br>Ruff 設定の独立化が必要。 |
| **3. フロントエンド & UI** | `bun` (`bun.lock`), Vite, Tailwind CSS v4<br>インタラクティブUIに Alpine.js + `@hamirilo/ui` を使用（React Islands / `shadcn/ui` は未導入） | **現状維持/要検討** | 基本UI構成・起点レイアウト（Standard App/Simple App等）の明文化が必要 |
| **4. ツールチェーン & 品質管理** | Biome (`biome.json`), Ruff, pytest, Justfile (`just check`, `just fmt`) が定義済み | **適合** | ツールチェーンの基本骨格は整備済み |

---

## 3. 検出された差分と改善推奨アクション

### 3.1. 優先度：高 (Must)
1. **AIオンボーディング設定の修正 (`GEMINI.md` / `CLAUDE.md`)**:
   - `GEMINI.md` 内のリンクを `../ai-dev-standards/ai/ONBOARDING.md` へ修正する。
   - 必要に応じて `CLAUDE.md` または `AGENTS.md` を配置し、AIエージェントの共通エントリポイントを揃える。
2. **`decisions/project-context.md` の作成**:
   - `decisions/` ディレクトリを作成し、Project Setup Matrix（A: 認証要否、B: ユーザー識別、C: 対象デバイス、D: 起点レイアウト、E: 業務権限）を定義した `project-context.md` を作成する。
3. **`pyproject.toml` の `hamirilo-platform` 参照解消**:
   - `tool.ruff.extend = "hamirilo-platform/..."` などの古いパス参照を削除またはインライン設定に移行する。

### 3.2. 優先度：中 (Should)
1. **API / 依存関係の整理**:
   - `djangorestframework` (DRF) から `django-ninja` への移行を検討する（Architecture Standard §1, §8）。
2. **データベースの統一**:
   - ルートに `db.sqlite3` が残っているため、Docker Compose 上の PostgreSQL を標準とする旨を明文化し、ローカル開発環境の構成を整理する。

---

## 4. 判定まとめ

- **準拠状況**: 一部要対応 (Action Required)
- **対応優先度**: 中（AI設定の修正と `decisions/project-context.md` の作成を先行実施推奨）
