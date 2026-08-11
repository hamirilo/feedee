# Justfile for feedee project

# Settings
set shell := ["bash", "-c"]

# Variables
compose      := "docker compose"
compose_prod := "docker compose --env-file .env -f compose.prod.yaml"
python_run   := "uv run python"
timestamp    := `date +%Y%m%d_%H%M%S`
backup_dir   := "backups"

# Show available commands in a clean, categorized format
default:
    #!/usr/bin/env bash
    printf "\033[1;36m=== 🚀 Feedee CLI Command Menu ===\033[0m\n\n"
    
    printf "\033[1;34m🐳 Docker Development\033[0m\n"
    printf "  \033[32mjust dev\033[0m                 Start dev environment (foreground)\n"
    printf "  \033[32mjust dev-bg\033[0m              Start dev environment (background)\n"
    printf "  \033[32mjust dev-down\033[0m            Stop dev environment\n"
    printf "  \033[32mjust dev-logs\033[0m            Tail dev environment logs\n"
    printf "  \033[32mjust dev-build\033[0m           Build dev images\n\n"

    printf "\033[1;34m🌐 Docker Production\033[0m\n"
    printf "  \033[32mjust prod-up\033[0m             Start production environment in background\n"
    printf "  \033[32mjust prod-down\033[0m           Stop production environment\n"
    printf "  \033[32mjust prod-logs\033[0m           Tail production logs\n"
    printf "  \033[32mjust prod-build\033[0m          Build production images\n"
    printf "  \033[32mjust prod-migrate\033[0m        Run database migrations in production\n"
    printf "  \033[32mjust prod-superuser\033[0m      Create a superuser in production\n"
    printf "  \033[32mjust prod-shell\033[0m          Open python shell in production backend\n\n"

    printf "\033[1;34m💻 Local Development (Direct OS)\033[0m\n"
    printf "  \033[32mjust local-migrate\033[0m       Run database migrations locally\n"
    printf "  \033[32mjust local-shell\033[0m         Open python shell locally\n"
    printf "  \033[32mjust local-worker\033[0m        Run RSS worker locally\n"
    printf "  \033[32mjust local-superuser\033[0m     Create a superuser locally\n\n"

    printf "\033[1;34m🛠️  Testing & Code Quality\033[0m\n"
    printf "  \033[32mjust test\033[0m                Run Django tests\n"
    printf "  \033[32mjust lint\033[0m                Run linters (ruff)\n"
    printf "  \033[32mjust fmt\033[0m                 Format code (ruff)\n"
    printf "  \033[32mjust clean\033[0m               Remove Python cache and build artifacts\n\n"

    printf "\033[1;34m💾 Database Backup & Restore\033[0m\n"
    printf "  \033[32mjust backup-dev\033[0m          Backup dev SQLite database\n"
    printf "  \033[32mjust backup-prod\033[0m         Backup production PostgreSQL database\n"
    printf "  \033[32mjust restore-dev <file>\033[0m  Restore dev SQLite database\n"
    printf "  \033[32mjust restore-prod <file>\033[0m Restore production PostgreSQL database\n"
    printf "  \033[32mjust list-backups\033[0m        List all backups\n\n"

    printf "\033[1;34m🔧 Utilities\033[0m\n"
    printf "  \033[32mjust git-safe-purge <p>\033[0m  Safely purge paths from git branch history\n\n"
    printf "Tip: Run \033[3mjust -l\033[0m to view the raw alphabetical list of all recipes.\n"


# ===================================================================
#  Development (Docker)
# ===================================================================

# Start dev environment in foreground (auto-cleans frontend cache)
dev:
    -rm -rf frontend/.next
    {{compose}} up --build

# Start dev environment in background (auto-cleans frontend cache)
dev-bg:
    -rm -rf frontend/.next
    {{compose}} up --build -d

# Stop dev environment
dev-down:
    {{compose}} down --remove-orphans

# Tail dev logs
dev-logs:
    {{compose}} logs -f

# Build dev images
dev-build:
    {{compose}} build

# ===================================================================
#  Production (Docker - Standalone)
# ===================================================================

[private]
prod-check-env:
    #!/usr/bin/env bash
    if [ ! -f .env ]; then
        echo "Missing .env. Run: cp .env.example .env"
        exit 1
    fi
    for key in POSTGRES_PASSWORD WORKER_API_TOKEN; do
        if ! grep -Eq "^$key=.+" .env; then
            echo "$key is missing or empty in .env. See .env.example."
            exit 1
        fi
    done

# Start production environment in background
prod-up: prod-check-env
    {{compose_prod}} up --build -d

# Stop production environment
prod-down:
    @POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-dummy} WORKER_API_TOKEN=${WORKER_API_TOKEN:-dummy} {{compose_prod}} down --remove-orphans

# Tail production logs
prod-logs:
    @POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-dummy} WORKER_API_TOKEN=${WORKER_API_TOKEN:-dummy} {{compose_prod}} logs -f

# Build production images
prod-build: prod-check-env
    {{compose_prod}} build

# Run database migrations in production environment
prod-migrate: prod-check-env
    {{compose_prod}} exec backend uv run python manage.py migrate

# Create superuser in production environment
prod-superuser: prod-check-env
    {{compose_prod}} exec backend uv run python manage.py create_admin_user

# Open interactive shell in production environment
prod-shell: prod-check-env
    {{compose_prod}} exec backend uv run python manage.py shell

# ===================================================================
#  Local Development (Direct Execution)
# ===================================================================

# Run database migrations locally
local-migrate:
    uv run python manage.py migrate

# Open python shell locally
local-shell:
    uv run python manage.py shell

# Run RSS worker locally
local-worker:
    go run rss_worker/main.go

# Create superuser locally
local-superuser:
    uv run python manage.py create_admin_user


# ===================================================================
#  Testing, Linting & Formatting
# ===================================================================

# Run tests (pytest)
test:
    uv run pytest

# Run linters (ruff)
lint:
    uv run ruff check .

# Run all code quality checks (ruff + biome + typos)
check:
    uv run ruff check .
    uv run ruff format --check .
    bun run biome check .
    uvx typos

# Format code (ruff)
fmt:
    uv run ruff format .

# Auto-fix linting and formatting
fix:
    uv run ruff check --fix . && uv run ruff format .

# ==============================================================================
# プラットフォーム管理 (hamirilo-platform)
# ==============================================================================

# hamirilo-platform submodule を最新（または指定タグ）に更新
[group('プラットフォーム管理')]
update-platform tag="":
    ./hamirilo-platform/scripts/update-platform.sh {{tag}}

# hamirilo-platform の AI ルールを同期する
[group('プラットフォーム管理')]
sync-ai mode="":
    ./hamirilo-platform/scripts/sync-claude.sh {{mode}}

# sync-ai のエイリアス
[group('プラットフォーム管理')]
sync-platform mode="":
    ./hamirilo-platform/scripts/sync-claude.sh {{mode}}

# プラットフォーム規約適合性・ドリフトチェック
[group('プラットフォーム管理')]
check-compliance level="2":
    ./hamirilo-platform/scripts/verify-compliance.sh --level {{level}}

# Remove Python cache and build artifacts
clean:
    find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name '*.py[co]' -delete 2>/dev/null || true
    rm -rf build/ dist/ *.egg-info


# ===================================================================
#  Database Backup & Restore
# ===================================================================

# Backup dev SQLite database
backup-dev:
    @mkdir -p {{backup_dir}}/dev
    cp db.sqlite3 {{backup_dir}}/dev/db_{{timestamp}}.sqlite3
    @echo "✓ Dev backup: {{backup_dir}}/dev/db_{{timestamp}}.sqlite3"

# Backup production PostgreSQL database
backup-prod: prod-check-env
    @mkdir -p {{backup_dir}}/prod
    {{compose_prod}} exec -T db pg_dump \
        -U ${POSTGRES_USER:-feedee} \
        -d ${POSTGRES_DB:-feedee} \
        --clean --if-exists \
        | gzip > {{backup_dir}}/prod/db_{{timestamp}}.sql.gz
    @echo "✓ Prod backup: {{backup_dir}}/prod/db_{{timestamp}}.sql.gz"

# Restore dev SQLite database (usage: just restore-dev <file>)
restore-dev file="":
    #!/usr/bin/env bash
    if [ -z "{{file}}" ]; then
        echo "Usage: just restore-dev <file>"
        echo "Available backups:"
        ls -1t {{backup_dir}}/dev/ 2>/dev/null || echo "  (none)"
        exit 1
    fi
    cp "{{file}}" db.sqlite3
    echo "✓ Restored from {{file}}"

# Restore production PostgreSQL database (usage: just restore-prod <file>)
restore-prod file="": prod-check-env
    #!/usr/bin/env bash
    if [ -z "{{file}}" ]; then
        echo "Usage: just restore-prod <file>"
        echo "Available backups:"
        ls -1t {{backup_dir}}/prod/ 2>/dev/null || echo "  (none)"
        exit 1
    fi
    gunzip -c "{{file}}" | {{compose_prod}} exec -T db psql \
        -U ${POSTGRES_USER:-feedee} \
        -d ${POSTGRES_DB:-feedee}
    echo "✓ Restored from {{file}}"

# List all backups
list-backups:
    @echo "=== Dev backups ==="
    @ls -1t {{backup_dir}}/dev/ 2>/dev/null || echo "  (none)"
    @echo ""
    @echo "=== Prod backups ==="
    @ls -1t {{backup_dir}}/prod/ 2>/dev/null || echo "  (none)"

# ===================================================================
#  Git Utilities
# ===================================================================

# Safely purge paths from current branch history (usage: just git-safe-purge <path1> <path2> ...)
git-safe-purge +paths:
    ./scripts/git_safe_purge_paths.sh {{paths}}
