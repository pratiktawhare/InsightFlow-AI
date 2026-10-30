from functools import lru_cache
import json
from pathlib import Path

import os
from typing import Annotated
from pydantic import field_validator
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # LLM
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"  # override with GROQ_MODEL in .env
    llm_temperature: float = 0.2

    # Transcription
    sarvam_api_key: str = ""
    sarvam_stt_translate_url: str = "https://api.sarvam.ai/speech-to-text-translate"
    sarvam_stt_model: str = "saaras:v2.5"
    whisper_model: str = "small"
    transcribe_language: str = "en"  # faster-whisper language hint for english mode

    # Pipeline
    chunk_minutes: int = 10  # audio chunk length before transcription
    sarvam_piece_seconds: int = 25  # Sarvam sync API accepts <=30s pieces
    retrieval_k: int = 4
    max_transcript_chars: int = 240_000  # guard-rail for LLM context

    # Embeddings / vector store
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_device: str = "cpu"

    # Storage paths
    data_dir: Path = DATA_DIR
    downloads_dir: Path = DATA_DIR / "downloads"
    uploads_dir: Path = DATA_DIR / "uploads"
    vector_db_dir: Path = DATA_DIR / "vector_db"

    # Database
    database_url: str = f"sqlite:///{DATA_DIR / 'insightflow.db'}"

    # CORS
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v):
        if isinstance(v, str):
            s = v.strip()
            if s.startswith("["):
                return json.loads(s)
            if not s:
                return []
            return [o.strip() for o in s.split(",") if o.strip()]
        return v

    def __init__(self, **kwargs):
        load_dotenv(BASE_DIR / ".env", override=False)
        super().__init__(**kwargs)


@lru_cache
def get_settings() -> Settings:
    return Settings()


def ensure_dirs(settings: Settings | None = None) -> None:
    s = settings or get_settings()
    for d in (s.data_dir, s.downloads_dir, s.uploads_dir, s.vector_db_dir):
        os.makedirs(d, exist_ok=True)
