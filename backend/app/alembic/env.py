"""Alembic environment — async対応。

PostgreSQL の asyncpg ドライバを使用するため、
`run_migrations_online` は `AsyncEngine.connect()` を使う非同期パターンを採用。
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.models import Base
from app.settings import settings

# alembic.ini の [loggers] 設定を反映
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# モデルの MetaData を渡すことで autogenerate が動作する
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """URL だけを使ってマイグレーションを実行（DB接続なし）。"""
    url = settings.database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """非同期エンジンで DB に接続してマイグレーションを実行。"""
    connectable = create_async_engine(settings.database_url)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """非同期マイグレーションのエントリーポイント。"""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
