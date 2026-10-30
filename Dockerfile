# ---- Frontend build stage: Vite + Tailwind ----
FROM oven/bun:1-slim AS frontend

WORKDIR /app

COPY package.json bun.lock .npmrc ./
# cat は空ファイルでも終了コード 0 を返すので、`cat a || cat b` では空のシークレットで
# fallback が発火せず、TOKEN が空のまま bun install が匿名で走って private パッケージの
# 取得が 401 で落ちる。空は「無い」ものとして扱い、中身の有無 (-s) で選ぶ。
RUN --mount=type=secret,id=packages_token \
    --mount=type=secret,id=github_token \
    if [ -s /run/secrets/packages_token ]; then \
      TOKEN=$(cat /run/secrets/packages_token); \
    elif [ -s /run/secrets/github_token ]; then \
      TOKEN=$(cat /run/secrets/github_token); \
    else \
      TOKEN=""; \
    fi && \
    if [ -n "$TOKEN" ]; then \
      export PACKAGES_TOKEN="$TOKEN"; \
      echo "//npm.pkg.github.com/:_authToken=${TOKEN}" >> .npmrc; \
    fi && \
    bun install --frozen-lockfile && \
    sed -i '/authToken/d' .npmrc

# tailwind.config.js は Tailwind v4 へ移行した際に削除済み (frontend/css/main.css に統合)。
# ここへ残すと COPY が "not found" で失敗する。
COPY vite.config.js ./
COPY frontend/ frontend/
COPY templates/ templates/
RUN bun run build

# ---- Python dependency stage ----
FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv pip install --system --no-cache -r pyproject.toml

# ---- Runtime stage ----
FROM python:3.13-slim

RUN addgroup --system app && adduser --system --ingroup app --home /home/app app

ENV HOME=/home/app

COPY --from=builder /usr/local /usr/local

WORKDIR /app
COPY . .

# Copy Vite build output
COPY --from=frontend /app/static/dist/ static/dist/

RUN mkdir -p /app/staticfiles /home/app \
  && chmod 775 /app/staticfiles \
  && chmod +x docker/entrypoint.sh \
  && chown -R app:app /app /home/app

USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
