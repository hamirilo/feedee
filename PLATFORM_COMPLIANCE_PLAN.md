# hamirilo-platform Compliance & Remediation Plan: `feedee`

This document details the audit findings and step-by-step remediation plan to align `/Users/papa/dev/feedee` with **hamirilo-platform** standards.

---

## 1. Compliance Status Overview

| Category | Status | Summary |
| :--- | :---: | :--- |
| **AI Rules & Onboarding** | 🟡 Action Needed | `GEMINI.md` present, but `.agents/` rules directory is missing. |
| **Toolchain & Quality** | 🔴 Action Needed | `just check` fails due to duplicate `biome` command execution in `package.json`. |
| **Security & Env** | 🟡 Action Needed | `.env.example` exists, but docker compose passes incorrect secret key variable. |
| **App Architecture** | 🔴 Action Needed | Legacy DRF serializers & dependencies remain; dual `backend/` and `frontend/` debt. |
| **Frontend Conventions** | 🔴 Action Needed | Native `alert()` and `confirm()` functions used in template scripts. |
| **Testing Setup** | 🔴 Action Needed | `just test` fails with 47 test breakages in `apps/rssapp/tests.py`. |

---

## 2. Identified Non-Compliant Items & Technical Debt

### 🔴 High Priority

1. **`just check` Task Failure (Biome Script Bug)**
   - **Issue**: `bun run biome check .` expands to `bunx @biomejs/biome@1.9.4 check check .` because `"biome"` in [`package.json`](file:///Users/papa/dev/feedee/package.json) already includes the `check` subcommand.
   - **Requirement**: `just check` must run cleanly without errors.
   - **Files**:
     - [`package.json`](file:///Users/papa/dev/feedee/package.json#L7)
     - [`Justfile`](file:///Users/papa/dev/feedee/Justfile)

2. **Test Suite Failure (47 Breakages in `apps/rssapp/tests.py`)**
   - **Issue**: Models refactored (e.g. `ArticleUserState`, `is_favorited`) are out of sync with test assertions, causing 47 failures during `just test`.
   - **Files**:
     - [`apps/rssapp/tests.py`](file:///Users/papa/dev/feedee/apps/rssapp/tests.py)

3. **DRF Dependency & Legacy Serializers (ADR-0003)**
   - **Issue**: `djangorestframework` remains in `pyproject.toml` & `INSTALLED_APPS`, and 109 lines of active DRF serializers exist in `apps/rssapp/serializers.py` despite `django-ninja` v2 API being active.
   - **Files**:
     - [`pyproject.toml`](file:///Users/papa/dev/feedee/pyproject.toml#L9)
     - [`config/settings/base.py`](file:///Users/papa/dev/feedee/config/settings/base.py#L26)
     - [`apps/rssapp/serializers.py`](file:///Users/papa/dev/feedee/apps/rssapp/serializers.py)

4. **Missing `.agents/` AI Rules Directory & Sync Task**
   - **Issue**: `.agents/` directory does not exist, and `just sync-ai` command is missing from `Justfile`.
   - **Files**:
     - [`Justfile`](file:///Users/papa/dev/feedee/Justfile)

### 🟡 Medium Priority

5. **Browser `alert()` and `confirm()` Native Calls**
   - **Issue**: Native `alert()` and `confirm()` popups called directly in templates.
   - **Files**:
     - [`templates/bookmarks/bookmarklet_install.html`](file:///Users/papa/dev/feedee/templates/bookmarks/bookmarklet_install.html#L98)
     - [`templates/rss/settings.html`](file:///Users/papa/dev/feedee/templates/rss/settings.html#L686)
     - [`templates/bookmarks/category_list.html`](file:///Users/papa/dev/feedee/templates/bookmarks/category_list.html#L122)

6. **Environment Key Mismatch in Docker Compose**
   - **Issue**: `compose.yaml` passes `FASTAPI_SECRET_KEY` instead of `DJANGO_SECRET_KEY`.
   - **Files**:
     - [`compose.yaml`](file:///Users/papa/dev/feedee/compose.yaml#L54)
     - [`compose.prod.yaml`](file:///Users/papa/dev/feedee/compose.prod.yaml#L52)

7. **Architectural Codebase Duplication**
   - **Issue**: Abandoned/standalone `backend/` (FastAPI) and `frontend/` (Next.js) directories exist alongside the main Django codebase.

---

## 3. Remediation Tasks & Execution Steps

### Task 1: Fix Toolchain & `just check`
- Change script in `package.json` from `"biome": "bunx @biomejs/biome@1.9.4 check"` to `"biome": "bunx @biomejs/biome@1.9.4"`.
- Ensure `mypy` is installed in `pyproject.toml` dev dependencies and added to `just check`:
  ```justfile
  check:
      uv run ruff check .
      bun run biome check .
      uv run mypy apps config
      uv run typos
  ```

### Task 2: Fix Test Suite (`apps/rssapp/tests.py`)
- Update queries and model assertions to align with updated schema (`ArticleUserState`, `is_read_later`, `is_favorited`).
- Fix HTTP response status code assertions (e.g. handle 302 redirects vs 200 OK).

### Task 3: Setup `.agents/` Rules & `sync-ai` Task
- Add `sync-ai:` task in `Justfile` pointing to platform synchronization script:
  ```justfile
  sync-ai:
      just sync-platform
  ```
- Run `just sync-platform` to mirror `.agents/rules/` into the repo.

### Task 4: Complete DRF Removal & API Migration
- Migrate remaining DRF views/serializers in `apps/rssapp` to `django-ninja` routers in `apps/api/api.py`.
- Remove `djangorestframework` from `pyproject.toml` and `config/settings/base.py`.

### Task 5: Replace Browser Popups & Fix Env Keys
- Replace `alert()` and `confirm()` in HTML templates with Alpine.js confirmation modals or `@hamirilo/ui` toasts.
- Fix environment variable name in `compose.yaml` and `compose.prod.yaml` (`SECRET_KEY=${DJANGO_SECRET_KEY:-...}`).

### Task 6: Clean Up Legacy Subdirectories
- Archive or remove unused `backend/` (FastAPI) and `frontend/` (Next.js) folders if no longer part of deployment pipeline.

---

## 4. Verification & Definition of Done

- [ ] `just check` passes completely with 0 errors.
- [ ] `just test` passes all tests cleanly.
- [ ] DRF dependencies and serializers completely eliminated.
- [ ] Zero native `alert()`/`confirm()` popups used.
- [ ] `.agents/` rules directory present and synced.
