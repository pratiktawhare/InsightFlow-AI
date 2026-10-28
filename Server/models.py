from sqlalchemy import Column, String, DateTime, Integer, Text
from database import Base
from datetime import datetime
import uuid

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    source = Column(String)  # "youtube" or "upload"
    source_url = Column(String)
    transcript = Column(Text)
    summary = Column(Text)
    language = Column(String, default="english")
    status = Column(String, default="processing")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processing_seconds = Column(Integer, default=0)

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String)
    status = Column(String, default="pending")
    current_stage = Column(String)  # "downloading", "transcribing", "analyzing", "complete"
    progress = Column(Integer, default=0)  # 0-100
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
