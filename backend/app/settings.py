from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database — asyncpg URL (postgresql+asyncpg://...)
    database_url: str = ""

    # App
    debug: bool = False
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    algorithm: str = "HS256"

    # Admin User Auto-Generation
    admin_username: str = "admin"
    admin_password: str = "admin-password"

    # Go RSS Worker Authentication
    worker_api_token: str = ""

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000"]


settings = Settings()

