from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TaskOut(BaseModel):
    id: str
    meeting_id: str
    description: str
    owner: str
    deadline: str
    done: bool
    order_index: int


class ChatSource(BaseModel):
    index: int
    text: str
    start: float | None = None
    end: float | None = None
    chunk: int | None = None


class ChatMessageOut(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    sources: list[ChatSource] | None = None
    created_at: datetime


class SegmentOut(BaseModel):
    start: float
    end: float
    text: str
    chunk: int = 0


class TaskUpdate(BaseModel):
    done: bool


class MeetingSummary(BaseModel):
    id: str
    title: str
    status: str
    stage: str
    progress: float
    source_type: str
    source_url: str | None
    file_name: str | None
    language: str
    duration_seconds: float
    word_count: int
    open_task_count: int = 0
    created_at: datetime


class MeetingDetail(MeetingSummary):
    transcript: str
    summary: str
    segments: list[SegmentOut]
    decisions: list[str]
    open_questions: list[str]
    chunk_count: int
    error: str | None
    tasks: list[TaskOut]
    messages: list[ChatMessageOut]


class MeetingList(BaseModel):
    items: list[MeetingSummary]
    total: int


class StatusEvent(BaseModel):
    meeting_id: str
    status: str
    stage: str
    progress: float
    detail: str = ""


class ChatQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
