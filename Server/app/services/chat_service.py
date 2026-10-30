"""Chat service: streaming RAG answers persisted as messages."""

from app.core import rag_engine
from app.db import LocalSessionFactory
from app.models import ChatMessage, Meeting


def _history(meeting_id: str, limit: int = 10) -> list[tuple[str, str]]:
    db = LocalSessionFactory()
    try:
        rows = (
            db.query(ChatMessage)
            .filter(ChatMessage.meeting_id == meeting_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        rows.reverse()
        leading = db.query(Meeting.summary).filter(Meeting.id == meeting_id).scalar() or ""
        return [("assistant_summary", leading), *[(r.role, r.content) for r in rows]]
    finally:
        db.close()


def stream_chat(meeting_id: str, question: str):
    """Yield SSE-formatted dicts: {"type": ...}. Persists both messages."""
    db = LocalSessionFactory()
    try:
        db.add(ChatMessage(meeting_id=meeting_id, role="user", content=question))
        db.commit()
    finally:
        db.close()

    sources = rag_engine.get_sources(meeting_id, question)
    yield {"type": "sources", "sources": sources}

    if not sources:
        msg = (
            "I could not find this information in the meeting transcript. "
            "Make sure the meeting is fully processed (status: ready) first."
        )
        full = msg
        for chunk in [msg[i : i + 24] for i in range(0, len(msg), 24)]:
            yield {"type": "delta", "text": chunk}
    else:
        parts: list[str] = []
        for delta in rag_engine.stream_rag_answer(meeting_id, question):
            if delta:
                parts.append(delta)
                yield {"type": "delta", "text": delta}
        full = "".join(parts)

    db = LocalSessionFactory()
    try:
        db.add(
            ChatMessage(
                meeting_id=meeting_id,
                role="assistant",
                content=full,
                sources=sources,
            )
        )
        db.commit()
        yield {"type": "done"}
    finally:
        db.close()
