import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


class Settings(BaseModel):
    provider: str = Field(default="openai", alias="LLM_PROVIDER")
    model: str = Field(default="gpt-4o-mini", alias="LLM_MODEL")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/novacart",
        alias="DATABASE_URL",
    )
    port: int = Field(default=8000, alias="AI_SERVICE_PORT")

    model_config = {"populate_by_name": True}


@lru_cache
def get_settings() -> Settings:
    return Settings(
        LLM_PROVIDER=os.getenv("LLM_PROVIDER", "openai"),
        LLM_MODEL=os.getenv("LLM_MODEL", "gpt-4o-mini"),
        OPENAI_API_KEY=os.getenv("OPENAI_API_KEY", ""),
        ANTHROPIC_API_KEY=os.getenv("ANTHROPIC_API_KEY", ""),
        DATABASE_URL=os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/novacart",
        ),
        AI_SERVICE_PORT=os.getenv("AI_SERVICE_PORT", "8000"),
    )

