import json
from typing import Any
from pydantic import field_validator
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
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3010",
        "http://127.0.0.1:3010",
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            # Clean leading/trailing single or double quotes
            if (v.startswith("'") and v.endswith("'")) or (v.startswith('"') and v.endswith('"')):
                v = v[1:-1].strip()
            
            # Check if it looks like a JSON array
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    # Strip brackets and try treating it as comma-separated
                    v = v[1:-1]
            
            # Handle comma-separated list
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()

