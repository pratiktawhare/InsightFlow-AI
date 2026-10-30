"""InsightFlow AI — FastAPI server.

Run:  .venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import ensure_dirs, get_settings
from app.db import Base, engine, LocalSessionFactory
from app.models import ChatMessage, Meeting, Task  # noqa: F401 (register models)
from app.routers import chat, exports, meetings, tasks

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_dirs(settings)
    Base.metadata.create_all(engine)
    # mark broken runs from a previous process as failed
    db = LocalSessionFactory()
    try:
        db.execute(
            text("UPDATE meetings SET status='failed', stage='error', "
                 "error='Processing was interrupted (server restarted).' "
                 "WHERE status IN ('pending','processing')"),
            {},
        )
        db.commit()
    finally:
        db.close()
    yield


app = FastAPI(
    title="InsightFlow AI",
    description="RAG-powered meeting & video intelligence: transcription, summaries, action items and chat.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)
app.include_router(tasks.router)
app.include_router(chat.router)
app.include_router(exports.router)


@app.get("/", include_in_schema=False)
def root():
    return {"service": "InsightFlow AI", "status": "ok"}


@app.get("/api/health", tags=["system"])
def health():
    ready = bool(settings.groq_api_key)
    sarvam = bool(settings.sarvam_api_key)
    return {
        "ok": True,
        "llm_configured": ready,
        "sarvam_configured": sarvam,
        "model": settings.groq_model,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
