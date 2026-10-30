import uuid
from datetime import datetime, timezone
from urllib.parse import quote as urlquote

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings, ensure_dirs


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


settings = get_settings()
ensure_dirs(settings)


def _encode_sqlite_path(url: str) -> str:
    """sqlite URLs cannot contain raw spaces/percent chars."""
    prefix = "sqlite:///"
    if url.startswith(prefix):
        raw = url[len(prefix):]
        return prefix + urlquote(raw)
    return url


engine = create_engine(
    _encode_sqlite_path(settings.database_url),
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)


@event.listens_for(engine, "connect", insert=True)
def _enable_sqlite_fk(dbapi_connection, connection_record):  # pragma: no cover
    if settings.database_url.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


LocalSessionFactory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    """FastAPI dependency."""
    db: Session = LocalSessionFactory()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def new_id() -> str:
    return uuid.uuid4().hex[:12]
