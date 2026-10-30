import asyncio
import json
import os
import shutil
import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import LocalSessionFactory
from app.db import get_db
from app.models import Meeting
from app.progress import publish, snapshot, subscribe, unsubscribe
from app.schemas import (
    MeetingDetail,
    MeetingList,
    MeetingSummary,
    SegmentOut,
    TaskOut,
)
from app.services import pipeline
from app.utils.storage import delete_meeting_files

settings = get_settings()
router = APIRouter(prefix="/api/meetings", tags=["meetings"])

ALLOWED_EXT = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".mp4", ".webm", ".aac", ".opus", ".mkv"}


def _summary(m: Meeting) -> MeetingSummary:
    return MeetingSummary(
        id=m.id,
        title=m.title,
        status=m.status,
        stage=m.stage.split(":")[0],
        progress=m.progress,
        source_type=m.source_type,
        source_url=m.source_url,
        file_name=m.file_name,
        language=m.language,
        duration_seconds=m.duration_seconds,
        word_count=m.word_count,
        open_task_count=sum(0 if t.done else 1 for t in m.tasks),
        created_at=m.created_at,
    )


def _detail(m: Meeting) -> MeetingDetail:
    s = _summary(m)
    return MeetingDetail(
        **s.model_dump(),
        transcript=m.transcript,
        summary=m.summary,
        segments=[SegmentOut(**seg) for seg in (m.segments or [])],
        decisions=m.decisions or [],
        open_questions=m.open_questions or [],
        chunk_count=m.chunk_count,
        error=m.error,
        tasks=[
            TaskOut(
                id=t.id,
                meeting_id=t.meeting_id,
                description=t.description,
                owner=t.owner,
                deadline=t.deadline,
                done=t.done,
                order_index=t.order_index,
            )
            for t in m.tasks
        ],
        messages=[
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "sources": msg.sources,
                "created_at": msg.created_at,
            }
            for msg in m.messages
        ],
    )


@router.post("", response_model=MeetingSummary, status_code=201)
def create_meeting(
    language: Annotated[str, Form()] = "english",
    youtube_url: Annotated[Optional[str], Form()] = None,
    file: Annotated[Optional[UploadFile], File()] = None,
    db: Session = Depends(get_db),
):
    """Start processing a meeting from a YouTube URL or an uploaded file."""
    youtube_url = (youtube_url or "").strip() or None

    if not youtube_url and not file:
        raise HTTPException(400, "Provide a YouTube URL or upload a file.")
    if youtube_url and file:
        raise HTTPException(400, "Provide only one source (URL or file).")
    if youtube_url and not (youtube_url.startswith("http://") or youtube_url.startswith("https://")):
        raise HTTPException(400, "Invalid URL.")
    if language.lower() not in ("english", "hinglish"):
        raise HTTPException(400, "language must be 'english' or 'hinglish'.")

    meeting_id = uuid.uuid4().hex[:12]
    source_path: str | None = None
    file_name: str | None = None
    source_type = "youtube" if youtube_url else "file"

    if file:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXT:
            raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXT))}")
        dest = os.path.join(settings.uploads_dir, f"{meeting_id}{ext}")
        with open(dest, "wb") as out:
            shutil.copyfileobj(file.file, out)
        source_path, file_name = dest, file.filename

    meeting = Meeting(
        id=meeting_id,
        source_type=source_type,
        source_url=youtube_url,
        file_name=file_name,
        language=language.lower(),
        status="pending",
        stage="queued",
        progress=0.0,
        title=(file_name.rsplit(".", 1)[0] if file_name else "Processing…"),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    publish(meeting_id, {"meeting_id": meeting_id, "status": "pending", "stage": "queued", "progress": 0.0, "detail": ""})
    pipeline.start_pipeline(meeting_id, language.lower(), youtube_url, source_path)
    return _summary(meeting)


@router.get("", response_model=MeetingList)
def list_meetings(
    q: str | None = None,
    status: str | None = None,
    limit: int = Query(60, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Meeting).order_by(Meeting.created_at.desc())
    if status:
        query = query.filter(Meeting.status == status)
    if q:
        like = f"%{q}%"
        query = query.filter(Meeting.title.ilike(like))
    total = query.count()
    rows = query.offset(offset).limit(limit).all()
    return MeetingList(items=[_summary(m) for m in rows], total=total)


def _get_or_404(db: Session, meeting_id: str) -> Meeting:
    m = db.get(Meeting, meeting_id)
    if not m:
        raise HTTPException(404, "Meeting not found")
    return m


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    return _detail(_get_or_404(db, meeting_id))


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    m = _get_or_404(db, meeting_id)
    from app.core import vector_store as vs

    # cleanup is best-effort: never block the row deletion on file/vectordb errors
    try:
        delete_meeting_files(meeting_id, m.source_url)
    except Exception as exc:
        print(f"[delete] cleanup failed for {meeting_id}: {exc}")
    try:
        vs.delete_vector_store(meeting_id)
    except Exception as exc:
        print(f"[delete] vector cleanup failed for {meeting_id}: {exc}")

    db.delete(m)
    db.commit()
    return None


@router.get("/{meeting_id}/progress", summary="SSE stream of pipeline progress")
async def progress_events(meeting_id: str, db: Session = Depends(get_db)):
    meeting = _get_or_404(db, meeting_id)

    def current_status():
        d = LocalSessionFactory()
        try:
            m = d.get(Meeting, meeting_id)
            if m:
                return {
                    "meeting_id": meeting_id,
                    "status": m.status,
                    "stage": m.stage.split(":")[0],
                    "progress": m.progress,
                    "detail": "",
                }
        finally:
            d.close()
        return None

    async def gen():
        q = subscribe(meeting_id)
        try:
            while True:
                try:
                    event = await asyncio.to_thread(q.get, True, 2.5)
                except Exception:
                    # queue.Empty after timeout — fall back to DB snapshot
                    event = snapshot(meeting_id) or current_status()
                    if event is None:
                        continue
                yield f"event: progress\ndata: {json.dumps(event)}\n\n"
                if event.get("status") in ("ready", "failed"):
                    break
        finally:
            unsubscribe(meeting_id, q)

    return StreamingResponse(gen(), media_type="text/event-stream")
