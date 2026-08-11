import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.routers import auth, bookmarks, common, feeds, reading, worker
from app.settings import settings
from app.utils.security import get_password_hash

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run alembic migrations programmatically on startup
    try:
        from alembic import command
        from alembic.config import Config

        logger.info("Running alembic migrations programmatically...")
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
        command.upgrade(alembic_cfg, "head")
        logger.info("Migrations completed successfully.")
    except Exception as e:
        logger.error(f"Error running programmatic migrations: {e}")

    # Startup: Check and create admin user automatically in the database
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(User).where(User.username == settings.admin_username)
            )
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                logger.info(f"Creating initial admin user: '{settings.admin_username}'...")
                new_admin = User(
                    username=settings.admin_username,
                    email=f"{settings.admin_username}@example.com",
                    hashed_password=get_password_hash(settings.admin_password),
                    is_active=True,
                    is_superuser=True,
                )
                session.add(new_admin)
                await session.commit()
                logger.info("Admin user created successfully.")
            else:
                logger.info(f"Admin user '{settings.admin_username}' already exists.")
        except Exception as e:
            logger.error(f"Error during admin user check/creation: {e}")
            await session.rollback()

    # Run migration from SQLite if db.sqlite3 exists
    async with AsyncSessionLocal() as session:
        try:
            from app.migrate import run_migration

            await run_migration(session)
        except Exception as e:
            logger.error(f"Error during SQLite to Postgres migration: {e}")

    yield


app = FastAPI(
    title="Feedee API",
    version="2.0.0",
    description="Feedee v2 — RSS reader & bookmark manager API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /app prefix to organize paths
app.include_router(auth.router, prefix="/app")
app.include_router(worker.router, prefix="/app")
app.include_router(common.router, prefix="/app")
app.include_router(feeds.router, prefix="/app")
app.include_router(reading.router, prefix="/app")
app.include_router(bookmarks.router, prefix="/app")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
