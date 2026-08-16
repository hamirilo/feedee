# ---- Frontend build stage: Vite + Tailwind ----
FROM oven/bun:1-slim AS frontend

WORKDIR /app

COPY package.json bun.lock .npmrc ./
RUN --mount=type=secret,id=github_token \
    if [ -f /run/secrets/github_token ]; then \
      echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github_token)" >> .npmrc; \
    fi && \
    bun install --frozen-lockfile && \
    sed -i '/authToken/d' .npmrc

COPY vite.config.js tailwind.config.js ./
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
