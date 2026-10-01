import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(Path(__file__).parents[1] / ".env")


class Settings(BaseSettings):
    provider: str = Field(default="openai", alias="LLM_PROVIDER")
    model: str = Field(default="gpt-4o-mini", alias="LLM_MODEL")
    openai_api_key: SecretStr = Field(default=SecretStr(""), alias="OPENAI_API_KEY")
    anthropic_api_key: SecretStr = Field(default=SecretStr(""), alias="ANTHROPIC_API_KEY")
    database_url: SecretStr = Field(
        default=SecretStr("postgresql://postgres:postgres@localhost:5432/novacart"),
        alias="DATABASE_URL",
    )
    ai_service_token: SecretStr = Field(default=SecretStr(""), alias="AI_SERVICE_TOKEN")
    embedding_model: str = Field(
        default="sentence-transformers/all-mpnet-base-v2",
        alias="POLICY_EMBEDDING_MODEL",
    )
    port: int = Field(default=8000, alias="AI_SERVICE_PORT")

    model_config = SettingsConfigDict(
        populate_by_name=True,
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


def configured_service_token() -> str:
    return get_settings().ai_service_token.get_secret_value()

