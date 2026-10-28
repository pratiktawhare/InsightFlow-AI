from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MeetingBase(BaseModel):
    title: str
    source: str
    language: str = "english"

class MeetingCreate(MeetingBase):
    source_url: Optional[str] = None

class MeetingUpdate(BaseModel):
    transcript: Optional[str] = None
    summary: Optional[str] = None
    title: Optional[str] = None

class Meeting(MeetingBase):
    id: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    processing_seconds: int

    class Config:
        from_attributes = True

class ProcessingJobBase(BaseModel):
    meeting_id: str
    status: str
    current_stage: str
    progress: int

class ProcessingJob(ProcessingJobBase):
    id: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    question: str
    answer: str

class ChatRequest(BaseModel):
    question: str
