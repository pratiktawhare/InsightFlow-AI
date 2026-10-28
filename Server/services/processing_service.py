import asyncio
from sqlalchemy.orm import Session
from models import Meeting, ProcessingJob
from datetime import datetime
import os

class ProcessingService:
    @staticmethod
    async def process_meeting(db: Session, meeting_id: str):
        """Background task to process meeting"""
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        job = db.query(ProcessingJob).filter(ProcessingJob.meeting_id == meeting_id).first()

        if not meeting or not job:
            return

        try:
            job.status = "processing"
            job.current_stage = "downloading"
            job.progress = 10
            db.commit()

            # Import existing pipeline
            from main import run_pipeline

            source = meeting.source_url or f"uploads/{meeting_id}.mp4"
            result = run_pipeline(source, language=meeting.language)

            job.current_stage = "analyzing"
            job.progress = 80
            db.commit()

            # Update meeting with results
            meeting.transcript = result.get("transcript", "")
            meeting.title = result.get("title", meeting.title)
            meeting.summary = result.get("summary", "")
            meeting.status = "completed"

            job.status = "completed"
            job.current_stage = "complete"
            job.progress = 100
            meeting.updated_at = datetime.utcnow()

            db.commit()

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            meeting.status = "failed"
            db.commit()

    @staticmethod
    def save_upload_file(file_content: bytes, meeting_id: str, filename: str) -> str:
        """Save uploaded file to disk"""
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{meeting_id}_{filename}"
        with open(file_path, "wb") as f:
            f.write(file_content)
        return file_path
