from sqlalchemy.orm import Session
from models import Meeting, ProcessingJob
from schemas import MeetingCreate, MeetingUpdate
from datetime import datetime
import uuid

class MeetingService:
    @staticmethod
    def create_meeting(db: Session, meeting_data: MeetingCreate) -> Meeting:
        meeting = Meeting(
            id=str(uuid.uuid4()),
            title=meeting_data.title or "Untitled Meeting",
            source=meeting_data.source,
            source_url=meeting_data.source_url,
            language=meeting_data.language,
            status="processing"
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        job = ProcessingJob(
            id=str(uuid.uuid4()),
            meeting_id=meeting.id,
            status="pending",
            current_stage="pending",
            progress=0
        )
        db.add(job)
        db.commit()

        return meeting

    @staticmethod
    def get_meeting(db: Session, meeting_id: str) -> Meeting:
        return db.query(Meeting).filter(Meeting.id == meeting_id).first()

    @staticmethod
    def get_all_meetings(db: Session, skip: int = 0, limit: int = 20) -> list:
        return db.query(Meeting).order_by(Meeting.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_meeting(db: Session, meeting_id: str, meeting_data: MeetingUpdate) -> Meeting:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return None

        update_data = meeting_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(meeting, field, value)

        meeting.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def delete_meeting(db: Session, meeting_id: str) -> bool:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if meeting:
            db.delete(meeting)
            db.commit()
            return True
        return False

    @staticmethod
    def get_processing_job(db: Session, meeting_id: str) -> ProcessingJob:
        return db.query(ProcessingJob).filter(ProcessingJob.meeting_id == meeting_id).first()
