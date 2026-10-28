from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import Meeting, MeetingCreate, ProcessingJob
from services.meeting_service import MeetingService
from typing import List

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

@router.post("", response_model=Meeting)
async def create_meeting(meeting: MeetingCreate, db: Session = Depends(get_db)):
    """Create a new meeting entry"""
    result = MeetingService.create_meeting(db, meeting)
    return result

@router.get("", response_model=List[Meeting])
async def list_meetings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all meetings with pagination"""
    meetings = MeetingService.get_all_meetings(db, skip, limit)
    return meetings

@router.get("/{meeting_id}", response_model=Meeting)
async def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Get a specific meeting by ID"""
    meeting = MeetingService.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Delete a meeting"""
    success = MeetingService.delete_meeting(db, meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"message": "Meeting deleted successfully"}

@router.get("/{meeting_id}/job", response_model=ProcessingJob)
async def get_processing_job(meeting_id: str, db: Session = Depends(get_db)):
    """Get processing job status"""
    job = MeetingService.get_processing_job(db, meeting_id)
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")
    return job
