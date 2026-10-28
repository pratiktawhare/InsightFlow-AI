from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import Meeting, MeetingCreate
from services.meeting_service import MeetingService
from services.processing_service import ProcessingService
from config import settings
import asyncio

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/file", response_model=Meeting)
async def upload_file(
    file: UploadFile = File(...),
    language: str = Form("english"),
    db: Session = Depends(get_db)
):
    """Upload a video/audio file"""
    if file.size and file.size > settings.max_file_size:
        raise HTTPException(status_code=413, detail="File too large")

    meeting_data = MeetingCreate(
        title=file.filename or "Uploaded Meeting",
        source="upload",
        language=language
    )
    meeting = MeetingService.create_meeting(db, meeting_data)

    # Save file
    content = await file.read()
    ProcessingService.save_upload_file(content, meeting.id, file.filename)

    # Start processing in background
    asyncio.create_task(ProcessingService.process_meeting(db, meeting.id))

    return meeting

@router.post("/youtube", response_model=Meeting)
async def upload_youtube(
    url: str = Form(...),
    language: str = Form("english"),
    db: Session = Depends(get_db)
):
    """Process a YouTube URL"""
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL")

    meeting_data = MeetingCreate(
        title="YouTube Meeting",
        source="youtube",
        source_url=url,
        language=language
    )
    meeting = MeetingService.create_meeting(db, meeting_data)

    # Start processing in background
    asyncio.create_task(ProcessingService.process_meeting(db, meeting.id))

    return meeting
