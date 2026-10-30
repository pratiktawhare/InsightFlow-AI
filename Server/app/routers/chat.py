import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core import rag_engine
from app.db import get_db
from app.models import Meeting
from app.schemas import ChatQuestion
from app.services.chat_service import stream_chat

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/meetings/{meeting_id}/chat")
def chat(meeting_id: str, payload: ChatQuestion, db: Session = Depends(get_db)):
    """SSE stream: `sources` event, then `delta` events, then `done`."""
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    def gen():
        for event in stream_chat(meeting_id, payload.question):
            yield f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/meetings/{meeting_id}/sources-preview")
def sources_preview(meeting_id: str, q: str, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return rag_engine.get_sources(meeting_id, q)
