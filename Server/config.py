import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./insightflow.db"

    # API
    api_title: str = "InsightFlow AI API"
    api_version: str = "1.0.0"
    api_description: str = "Meeting intelligence platform with RAG"

    # Processing
    max_file_size: int = 2 * 1024 * 1024 * 1024  # 2GB
    upload_dir: str = "uploads"
    processing_timeout: int = 1800  # 30 minutes

    # LLM
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    sarvam_api_key: str = os.getenv("SARVAM_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra fields in .env

settings = Settings()
