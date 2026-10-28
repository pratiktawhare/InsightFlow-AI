























# InsightFlow AI Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete professional meeting intelligence platform with FastAPI REST API backend and React TypeScript frontend enabling users to upload/process videos, get AI-powered summaries, extract action items, and chat with meeting transcripts via RAG.

**Architecture:** 
- FastAPI backend exposes REST endpoints for video upload, processing, meeting retrieval, and RAG-powered chat
- React frontend with TypeScript provides upload interface, meeting library, detail views with tabs (overview/transcript/chat/insights), and analytics dashboard
- SQLite database stores meeting metadata; ChromaDB handles vector embeddings for RAG
- Real-time processing updates via polling with progress tracking

**Tech Stack:** 
- Backend: FastAPI, SQLAlchemy ORM, Pydantic, ChromaDB, LangChain, Mistral AI
- Frontend: React 19, TypeScript, TailwindCSS, React Router, TanStack Query, Zustand, Framer Motion
- Database: SQLite, ChromaDB vector store

## Global Constraints

- Python 3.9+, FastAPI 0.100+, Uvicorn
- React 19.3+, TypeScript 6.0+, Node 18+
- API responses use snake_case JSON; frontend uses camelCase internally
- All timestamps in ISO 8601 format UTC
- Max file upload 2GB, video processing timeout 30 minutes
- All UI components must be responsive (mobile-first)
- Dark/light mode support required

---

## File Structure

```
Server/
├── app.py                          # FastAPI app initialization
├── config.py                       # Configuration & env vars
├── models.py                       # SQLAlchemy ORM models
├── schemas.py                      # Pydantic request/response schemas
├── database.py                     # Database setup & session management
├── api/
│   ├── __init__.py
│   ├── meetings.py                 # Meeting CRUD endpoints
│   ├── upload.py                   # File upload & processing endpoints
│   ├── chat.py                     # RAG Q&A endpoints
│   └── health.py                   # Health check endpoint
├── services/
│   ├── __init__.py
│   ├── meeting_service.py          # Meeting business logic
│   ├── processing_service.py       # Video processing pipeline
│   └── rag_service.py              # RAG query handling
├── core/                           # (existing) Transcription, summarization
├── utils/                          # (existing) Audio processing
└── requirements.txt                # Updated dependencies

Client/
├── src/
│   ├── App.tsx                     # Main app routing
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles
│   ├── api/
│   │   ├── client.ts               # Axios instance & base config
│   │   └── endpoints.ts            # API endpoint definitions
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── features/
│   │       ├── UploadArea.tsx
│   │       ├── MeetingCard.tsx
│   │       ├── TranscriptView.tsx
│   │       ├── ChatInterface.tsx
│   │       ├── InsightsPanel.tsx
│   │       └── MeetingStats.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Upload.tsx
│   │   ├── MeetingDetail.tsx
│   │   ├── Meetings.tsx
│   │   └── Analytics.tsx
│   ├── hooks/
│   │   ├── useApi.ts
│   │   ├── useMeetings.ts
│   │   └── useProcessing.ts
│   ├── stores/
│   │   ├── meetingStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── api.ts
│   │   └── domain.ts
│   └── utils/
│       ├── formatters.ts
│       └── constants.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Task Breakdown

### Phase 1: Backend API Layer (Tasks 1-5)

### Task 1: Database Models & Configuration

**Files:**
- Create: `Server/config.py`
- Create: `Server/database.py`
- Create: `Server/models.py`
- Create: `Server/schemas.py`
- Modify: `Server/requirements.txt`

**Interfaces:**
- Produces: `Meeting`, `ProcessingJob` SQLAlchemy models; `MeetingSchema`, `ChatMessageSchema` Pydantic schemas; `get_db()` session generator

**Steps:**

- [ ] **Step 1: Update requirements.txt with database dependencies**

```txt
# Add to existing requirements.txt
sqlalchemy>=2.0.0
pydantic-settings>=2.0.0
```

- [ ] **Step 2: Create config.py for environment configuration**

```python
# Server/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./insightflow.db"
    
    # API
    api_title: str = "InsightFlow AI API"
    api_version: str = "1.0.0"
    api_description: str = "Meeting intelligence platform with RAG"
    
    # Processing
    max_file_size: int = 2 * 1024 * 1024 * 1024  # 2GB
    upload_dir: str = "uploads"
    processing_timeout: int = 1800  # 30 minutes
    
    # LLM
    mistral_api_key: str = os.getenv("MISTRAL_API_KEY", "")
    sarvam_api_key: str = os.getenv("SARVAM_API_KEY", "")
    
    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 3: Create database.py for database connection**

```python
# Server/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings
import os

os.makedirs(settings.upload_dir, exist_ok=True)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Create models.py with SQLAlchemy models**

```python
# Server/models.py
from sqlalchemy import Column, String, DateTime, Integer, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from database import Base
from datetime import datetime
import enum
import uuid

class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

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
    status = Column(String, default=ProcessingStatus.PENDING)
    current_stage = Column(String)  # "downloading", "transcribing", "analyzing", "complete"
    progress = Column(Integer, default=0)  # 0-100
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 5: Create schemas.py with Pydantic models**

```python
# Server/schemas.py
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
    transcript: Optional[str]
    summary: Optional[str]
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
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    question: str
    answer: str

class ChatRequest(BaseModel):
    question: str
```

- [ ] **Step 6: Run database creation test**

```bash
cd Server
python -c "from database import engine, Base; Base.metadata.create_all(bind=engine); print('✓ Database initialized')"
```

Expected: `✓ Database initialized`

- [ ] **Step 7: Commit**

```bash
git add Server/config.py Server/database.py Server/models.py Server/schemas.py Server/requirements.txt
git commit -m "feat: add database models and configuration"
```

---

### Task 2: FastAPI App Setup & Health Check

**Files:**
- Create: `Server/app.py`
- Modify: `Server/requirements.txt`

**Interfaces:**
- Consumes: `settings` from `config.py`, `get_db` from `database.py`
- Produces: FastAPI app instance with CORS enabled, health check endpoint at `GET /api/health`

**Steps:**

- [ ] **Step 1: Add FastAPI & CORS to requirements.txt**

```txt
# Add to existing requirements.txt
fastapi>=0.100.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
```

- [ ] **Step 2: Create app.py with FastAPI initialization**

```python
# Server/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.api_version,
        "service": "InsightFlow AI API"
    }

@app.get("/")
async def root():
    return {"message": "InsightFlow AI API", "docs": "/docs"}
```

- [ ] **Step 3: Test FastAPI startup**

```bash
cd Server
python -m uvicorn app:app --reload --port 8000
```

Expected output: `Uvicorn running on http://127.0.0.1:8000`

Let it start, then in another terminal:
```bash
curl http://localhost:8000/api/health
```

Expected: `{"status":"healthy","version":"1.0.0","service":"InsightFlow AI API"}`

- [ ] **Step 4: Commit**

```bash
git add Server/app.py Server/requirements.txt
git commit -m "feat: initialize FastAPI app with CORS and health check"
```

---

### Task 3: Meetings CRUD API Endpoints

**Files:**
- Create: `Server/api/__init__.py`
- Create: `Server/api/meetings.py`
- Create: `Server/services/__init__.py`
- Create: `Server/services/meeting_service.py`
- Modify: `Server/app.py`

**Interfaces:**
- Consumes: `Meeting` model, `MeetingSchema`, `get_db()`, `settings`
- Produces: `GET /api/meetings`, `GET /api/meetings/{id}`, `POST /api/meetings`, `DELETE /api/meetings/{id}` endpoints

**Steps:**

- [ ] **Step 1: Create meeting_service.py with business logic**

```python
# Server/services/meeting_service.py
from sqlalchemy.orm import Session
from models import Meeting, ProcessingJob, ProcessingStatus
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
            status=ProcessingStatus.PENDING,
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
```

- [ ] **Step 2: Create api/meetings.py endpoints**

```python
# Server/api/meetings.py
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
```

- [ ] **Step 3: Update app.py to include meetings router**

```python
# Server/app.py (modify)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import Base, engine
from api.meetings import router as meetings_router  # Add this

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings_router)  # Add this

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.api_version,
        "service": "InsightFlow AI API"
    }

@app.get("/")
async def root():
    return {"message": "InsightFlow AI API", "docs": "/docs"}
```

- [ ] **Step 4: Test endpoints with curl**

```bash
# Create meeting
curl -X POST http://localhost:8000/api/meetings \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Meeting","source":"youtube","language":"english"}'

# List meetings
curl http://localhost:8000/api/meetings

# Get specific meeting (replace {id} with ID from create response)
curl http://localhost:8000/api/meetings/{id}
```

Expected: 200 responses with meeting objects

- [ ] **Step 5: Commit**

```bash
git add Server/api/meetings.py Server/services/meeting_service.py Server/app.py
git commit -m "feat: add meetings CRUD API endpoints"
```

---

### Task 4: File Upload & Processing Endpoints

**Files:**
- Create: `Server/api/upload.py`
- Create: `Server/services/processing_service.py`
- Modify: `Server/requirements.txt`
- Modify: `Server/app.py`

**Interfaces:**
- Consumes: `MeetingService`, `get_db()`, `settings`, existing transcriber/summarizer modules
- Produces: `POST /api/upload` endpoint (file or YouTube URL), async background processing

**Steps:**

- [ ] **Step 1: Add task queue dependency to requirements.txt**

```txt
# Add to requirements.txt
python-multipart>=0.0.6
aiofiles>=23.0.0
```

- [ ] **Step 2: Create processing_service.py**

```python
# Server/services/processing_service.py
import asyncio
from sqlalchemy.orm import Session
from models import Meeting, ProcessingJob
from datetime import datetime
import os
from pathlib import Path

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
```

- [ ] **Step 3: Create api/upload.py**

```python
# Server/api/upload.py
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
```

- [ ] **Step 4: Update app.py to include upload router**

```python
# Server/app.py (modify)
from api.meetings import router as meetings_router
from api.upload import router as upload_router  # Add this

app.include_router(meetings_router)
app.include_router(upload_router)  # Add this
```

- [ ] **Step 5: Test file upload**

```bash
# Create a test file
echo "test audio content" > test.wav

# Upload file
curl -X POST http://localhost:8000/api/upload/file \
  -F "file=@test.wav" \
  -F "language=english"

# Check processing status
curl http://localhost:8000/api/meetings/{meeting_id}/job
```

- [ ] **Step 6: Commit**

```bash
git add Server/api/upload.py Server/services/processing_service.py Server/app.py Server/requirements.txt
git commit -m "feat: add file upload and background processing"
```

---

### Task 5: RAG Chat API Endpoint

**Files:**
- Create: `Server/api/chat.py`
- Create: `Server/services/rag_service.py`
- Modify: `Server/app.py`

**Interfaces:**
- Consumes: `ChatRequest` schema, `Meeting` model, existing `core.rag_engine`
- Produces: `POST /api/meetings/{meeting_id}/chat` endpoint returning `ChatMessage` response

**Steps:**

- [ ] **Step 1: Create rag_service.py**

```python
# Server/services/rag_service.py
from sqlalchemy.orm import Session
from models import Meeting
from core.rag_engine import build_rag_chain, ask_question

class RAGService:
    _rag_chains = {}  # In-memory cache of RAG chains
    
    @staticmethod
    def get_or_build_chain(db: Session, meeting_id: str):
        """Get or build RAG chain for a meeting"""
        if meeting_id in RAGService._rag_chains:
            return RAGService._rag_chains[meeting_id]
        
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting or not meeting.transcript:
            raise ValueError("Meeting not found or transcript missing")
        
        chain = build_rag_chain(meeting.transcript)
        RAGService._rag_chains[meeting_id] = chain
        return chain
    
    @staticmethod
    def query(db: Session, meeting_id: str, question: str) -> str:
        """Query meeting via RAG"""
        chain = RAGService.get_or_build_chain(db, meeting_id)
        answer = ask_question(chain, question)
        return answer
    
    @staticmethod
    def clear_chain(meeting_id: str):
        """Clear cached chain for a meeting"""
        if meeting_id in RAGService._rag_chains:
            del RAGService._rag_chains[meeting_id]
```

- [ ] **Step 2: Create api/chat.py**

```python
# Server/api/chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import ChatRequest, ChatMessage
from services.rag_service import RAGService

router = APIRouter(prefix="/api/meetings/{meeting_id}/chat", tags=["chat"])

@router.post("", response_model=ChatMessage)
async def chat_with_meeting(
    meeting_id: str,
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Chat with meeting transcript via RAG"""
    try:
        answer = RAGService.query(db, meeting_id, request.question)
        return ChatMessage(question=request.question, answer=answer)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
```

- [ ] **Step 3: Update app.py**

```python
# Server/app.py (modify)
from api.chat import router as chat_router  # Add this

app.include_router(chat_router)  # Add this
```

- [ ] **Step 4: Test chat endpoint**

```bash
# First, ensure a meeting has been processed with transcript
# Then:
curl -X POST http://localhost:8000/api/meetings/{meeting_id}/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What were the main topics discussed?"}'
```

Expected: 200 response with question and answer

- [ ] **Step 5: Commit**

```bash
git add Server/api/chat.py Server/services/rag_service.py Server/app.py
git commit -m "feat: add RAG-powered chat endpoint"
```

---

## Phase 2: Frontend Setup & Core Components (Tasks 6-10)

### Task 6: Frontend Dependencies & Tooling Setup

**Files:**
- Modify: `Client/package.json`
- Create: `Client/tailwind.config.js`
- Create: `Client/postcss.config.js`
- Modify: `Client/vite.config.ts`
- Create: `Client/.env.local`

**Interfaces:**
- Produces: Configured Vite dev server, TailwindCSS, API client setup ready for Tasks 7+

**Steps:**

- [ ] **Step 1: Update package.json with frontend dependencies**

```json
{
  "name": "insightflow-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.292.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "eslint": "^10.13.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.7",
    "globals": "^17.13.0",
    "typescript": "~6.0.3",
    "typescript-eslint": "^8.71.2",
    "vite": "^8.3.4",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16"
  }
}
```

- [ ] **Step 2: Create tailwind.config.js**

```javascript
// Client/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        secondary: {
          50: "#f0fdf4",
          500: "#10b981",
          600: "#059669",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Create postcss.config.js**

```javascript
// Client/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 4: Update vite.config.ts**

```typescript
// Client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 5: Create .env.local**

```
# Client/.env.local
VITE_API_BASE_URL=http://localhost:8000/api
```

- [ ] **Step 6: Install dependencies**

```bash
cd Client
npm install
```

Expected: `added X packages` without errors

- [ ] **Step 7: Commit**

```bash
git add Client/package.json Client/tailwind.config.js Client/postcss.config.js Client/vite.config.ts Client/.env.local
git commit -m "feat: setup frontend tooling with TailwindCSS and dependencies"
```

---

### Task 7: API Client & TypeScript Types

**Files:**
- Create: `Client/src/types/api.ts`
- Create: `Client/src/types/domain.ts`
- Create: `Client/src/api/client.ts`
- Create: `Client/src/api/endpoints.ts`

**Interfaces:**
- Produces: Typed API client functions and TypeScript types for all API responses

**Steps:**

- [ ] **Step 1: Create type definitions**

```typescript
// Client/src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  status: string;
}

export interface Meeting {
  id: string;
  title: string;
  source: "youtube" | "upload";
  source_url?: string;
  transcript?: string;
  summary?: string;
  status: "processing" | "completed" | "failed";
  language: string;
  created_at: string;
  updated_at: string;
  processing_seconds: number;
}

export interface ProcessingJob {
  id: string;
  meeting_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  current_stage: string;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  question: string;
  answer: string;
}

export interface ChatRequest {
  question: string;
}
```

- [ ] **Step 2: Create domain types**

```typescript
// Client/src/types/domain.ts
export type MeetingStatus = "processing" | "completed" | "failed";
export type SourceType = "youtube" | "upload";
export type Language = "english" | "hinglish";

export interface Meeting {
  id: string;
  title: string;
  source: SourceType;
  sourceUrl?: string;
  transcript?: string;
  summary?: string;
  actionItems?: string;
  keyDecisions?: string;
  openQuestions?: string;
  status: MeetingStatus;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  processingSeconds: number;
}

export interface MeetingDetail extends Meeting {
  processingJob?: ProcessingJob;
}

export interface ProcessingJob {
  id: string;
  meetingId: string;
  status: "pending" | "processing" | "completed" | "failed";
  currentStage: string;
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 3: Create API client**

```typescript
// Client/src/api/client.ts
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

- [ ] **Step 4: Create API endpoints**

```typescript
// Client/src/api/endpoints.ts
import { apiClient } from './client';
import { Meeting, ProcessingJob, ChatMessage, ChatRequest } from '../types/api';

export const meetingsAPI = {
  // Meetings CRUD
  list: (skip = 0, limit = 20) => 
    apiClient.get<Meeting[]>('/meetings', { params: { skip, limit } }),
  
  get: (id: string) => 
    apiClient.get<Meeting>(`/meetings/${id}`),
  
  delete: (id: string) => 
    apiClient.delete(`/meetings/${id}`),
  
  // Processing status
  getProcessingJob: (meetingId: string) => 
    apiClient.get<ProcessingJob>(`/meetings/${meetingId}/job`),
  
  // Upload endpoints
  uploadFile: (file: File, language: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    return apiClient.post<Meeting>('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadYouTube: (url: string, language: string) => {
    const formData = new FormData();
    formData.append('url', url);
    formData.append('language', language);
    return apiClient.post<Meeting>('/upload/youtube', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Chat
  chat: (meetingId: string, request: ChatRequest) => 
    apiClient.post<ChatMessage>(`/meetings/${meetingId}/chat`, request),
};

export const healthAPI = {
  check: () => apiClient.get('/health'),
};
```

- [ ] **Step 5: Test API client**

```bash
cd Client
npm install
npm run dev
```

Open browser console and test:
```javascript
import { healthAPI } from './api/endpoints';
healthAPI.check().then(r => console.log(r.data));
```

Expected: `{status: "healthy", ...}`

- [ ] **Step 6: Commit**

```bash
git add Client/src/types/ Client/src/api/
git commit -m "feat: add TypeScript types and API client"
```

---

### Task 8: Base UI Components

**Files:**
- Create: `Client/src/components/ui/Button.tsx`
- Create: `Client/src/components/ui/Input.tsx`
- Create: `Client/src/components/ui/Card.tsx`
- Create: `Client/src/components/ui/Badge.tsx`
- Create: `Client/src/components/ui/Tabs.tsx`
- Create: `Client/src/components/ui/Toast.tsx`
- Create: `Client/src/components/ui/Modal.tsx`
- Modify: `Client/src/index.css`

**Interfaces:**
- Produces: Reusable, styled UI components for all pages

**Steps:**

- [ ] **Step 1: Update global styles**

```css
/* Client/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Source Sans Pro',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  scroll-behavior: smooth;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

- [ ] **Step 2: Create Button component**

```typescript
// Client/src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-gray-400',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 disabled:bg-gray-400',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  );
};
```

- [ ] **Step 3: Create Input component**

```typescript
// Client/src/components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {helperText && <p className="text-gray-500 text-sm mt-1">{helperText}</p>}
    </div>
  );
};
```

- [ ] **Step 4: Create Card component**

```typescript
// Client/src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${
        hoverable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
```

- [ ] **Step 5: Create Badge component**

```typescript
// Client/src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
```

- [ ] **Step 6: Create Tabs component**

```typescript
// Client/src/components/ui/Tabs.tsx
import React, { useState } from 'react';

interface TabsProps {
  tabs: { label: string; content: React.ReactNode; id: string }[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
```

- [ ] **Step 7: Create Toast component**

```typescript
// Client/src/components/ui/Toast.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`${typeClasses[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <X size={18} />
      </button>
    </div>
  );
};
```

- [ ] **Step 8: Create Modal component**

```typescript
// Client/src/components/ui/Modal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
```

- [ ] **Step 9: Test components**

```bash
cd Client
npm run dev
```

Open browser and visually verify components load

- [ ] **Step 10: Commit**

```bash
git add Client/src/components/ui/ Client/src/index.css
git commit -m "feat: add base UI components"
```

---

### Task 9: Layout Components (Header, Sidebar)

**Files:**
- Create: `Client/src/components/layout/Header.tsx`
- Create: `Client/src/components/layout/Sidebar.tsx`
- Create: `Client/src/components/layout/Layout.tsx`
- Create: `Client/src/stores/uiStore.ts`

**Interfaces:**
- Produces: Reusable layout wrapper with header and sidebar navigation

**Steps:**

- [ ] **Step 1: Create UI store for sidebar state**

```typescript
// Client/src/stores/uiStore.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  darkMode: false,
  toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
  toasts: [],
  addToast: (message, type) =>
    set(state => ({
      toasts: [...state.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),
}));
```

- [ ] **Step 2: Create Header component**

```typescript
// Client/src/components/layout/Header.tsx
import React from 'react';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { toggleSidebar, darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold text-primary-600">InsightFlow AI</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Step 3: Create Sidebar component**

```typescript
// Client/src/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Upload,
  FolderOpen,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <Home size={20} /> },
  { label: 'Upload', path: '/upload', icon: <Upload size={20} /> },
  { label: 'Meetings', path: '/meetings', icon: <FolderOpen size={20} /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen } = useUIStore();
  const location = useLocation();

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gray-900 text-white transition-all duration-300 overflow-y-auto`}
    >
      <nav className="p-4 space-y-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              {item.icon}
              {sidebarOpen && (
                <span className="flex-1 text-sm font-medium">{item.label}</span>
              )}
              {sidebarOpen && isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
```

- [ ] **Step 4: Create Layout wrapper**

```typescript
// Client/src/components/layout/Layout.tsx
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../stores/uiStore';
import { Toast } from '../ui/Toast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, toasts, removeToast } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Test layout in App.tsx**

Modify `Client/src/App.tsx` temporarily:

```typescript
import { Layout } from './components/layout/Layout';

function App() {
  return (
    <Layout>
      <div>
        <h2>Welcome to InsightFlow AI</h2>
        <p>Layout is working correctly</p>
      </div>
    </Layout>
  );
}

export default App;
```

- [ ] **Step 6: Run and verify**

```bash
npm run dev
```

Verify header and sidebar render correctly

- [ ] **Step 7: Commit**

```bash
git add Client/src/components/layout/ Client/src/stores/
git commit -m "feat: add layout components with header and sidebar"
```

---

### Task 10: React Router Setup

**Files:**
- Create: `Client/src/pages/Dashboard.tsx`
- Create: `Client/src/pages/Upload.tsx`
- Create: `Client/src/pages/Meetings.tsx`
- Create: `Client/src/pages/Analytics.tsx`
- Create: `Client/src/pages/Settings.tsx`
- Modify: `Client/src/App.tsx`
- Modify: `Client/src/main.tsx`

**Interfaces:**
- Produces: Working router with 5 stub pages for navigation

**Steps:**

- [ ] **Step 1: Create Dashboard page**

```typescript
// Client/src/pages/Dashboard.tsx
import React from 'react';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Jan', meetings: 4 },
  { name: 'Feb', meetings: 6 },
  { name: 'Mar', meetings: 8 },
];

export const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-gray-600 text-sm font-medium">Total Meetings</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">24</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-gray-600 text-sm font-medium">Processing</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">2</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-gray-600 text-sm font-medium">Storage Used</h3>
          <p className="text-3xl font-bold text-secondary-600 mt-2">1.2 GB</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="meetings" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
```

- [ ] **Step 2: Create Upload page**

```typescript
// Client/src/pages/Upload.tsx
import React, { useState } from 'react';
import { Upload, YouTube } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const Upload: React.FC = () => {
  const [method, setMethod] = useState<'file' | 'youtube'>('file');
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Upload Meeting</h1>

      <Card className="p-8 max-w-2xl">
        <div className="mb-6 flex gap-4">
          <Button
            variant={method === 'file' ? 'primary' : 'outline'}
            onClick={() => setMethod('file')}
            className="flex items-center gap-2"
          >
            <Upload size={18} />
            Upload File
          </Button>
          <Button
            variant={method === 'youtube' ? 'primary' : 'outline'}
            onClick={() => setMethod('youtube')}
            className="flex items-center gap-2"
          >
            <YouTube size={18} />
            YouTube URL
          </Button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="english">English</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>

        {method === 'file' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">Drag & drop your video/audio file here</p>
            <Button variant="outline" onClick={() => console.log('File picker')}>
              Browse Files
            </Button>
          </div>
        ) : (
          <Input
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
          />
        )}

        <Button
          className="w-full mt-6"
          loading={loading}
          onClick={() => setLoading(true)}
        >
          Process Meeting
        </Button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Max file size: 2GB | Processing time: 5-30 minutes
          </p>
        </div>
      </Card>
    </div>
  );
};
```

- [ ] **Step 3: Create Meetings page**

```typescript
// Client/src/pages/Meetings.tsx
import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

const mockMeetings = [
  {
    id: '1',
    title: 'Product Planning Q1',
    date: '2026-01-28',
    status: 'completed',
    duration: '45 min',
  },
  {
    id: '2',
    title: 'Engineering Standup',
    date: '2026-01-27',
    status: 'completed',
    duration: '30 min',
  },
];

export const Meetings: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <input
          type="search"
          placeholder="Search meetings..."
          className="px-4 py-2 border border-gray-300 rounded-lg w-64"
        />
      </div>

      <div className="grid gap-4">
        {mockMeetings.map(meeting => (
          <Link key={meeting.id} to={`/meeting/${meeting.id}`}>
            <Card hoverable className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {meeting.title}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">{meeting.date}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="success">{meeting.status}</Badge>
                  <span className="text-gray-600 text-sm">{meeting.duration}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Create Analytics page**

```typescript
// Client/src/pages/Analytics.tsx
import React from 'react';
import { Card } from '../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Week 1', meetings: 5, processed: 5 },
  { name: 'Week 2', meetings: 8, processed: 7 },
  { name: 'Week 3', meetings: 6, processed: 6 },
];

export const Analytics: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Meeting Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="meetings"
                stroke="#6366f1"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="processed"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Processing Time</span>
              <span className="font-bold">12 min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Action Items Created</span>
              <span className="font-bold">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Questions Asked</span>
              <span className="font-bold">89</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Create Settings page**

```typescript
// Client/src/pages/Settings.tsx
import React from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Settings: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card className="p-6 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Account Settings</h2>

        <div className="space-y-4">
          <Input label="Email" type="email" placeholder="your@email.com" />
          <Input label="Full Name" placeholder="Your Name" />

          <div>
            <label className="block text-sm font-medium mb-2">
              Default Language
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>English</option>
              <option>Hinglish</option>
            </select>
          </div>

          <Button className="w-full mt-6">Save Changes</Button>
        </div>
      </Card>
    </div>
  );
};
```

- [ ] **Step 6: Update App.tsx with router**

```typescript
// Client/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Meetings } from './pages/Meetings';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
```

- [ ] **Step 7: Update main.tsx with QueryClient**

```typescript
// Client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 8: Test routing**

```bash
npm run dev
```

Verify all pages accessible via navigation

- [ ] **Step 9: Commit**

```bash
git add Client/src/pages/ Client/src/App.tsx Client/src/main.tsx
git commit -m "feat: add routing and stub pages"
```

---

## Phase 3: Meeting Detail & Chat Interface (Tasks 11-13)

### Task 11: Meeting Detail Page with Tabs

**Files:**
- Create: `Client/src/pages/MeetingDetail.tsx`
- Create: `Client/src/components/features/TranscriptView.tsx`
- Modify: `Client/src/App.tsx`

**Interfaces:**
- Consumes: `Meeting` type, `meetingsAPI.get()`
- Produces: `GET /meeting/:id` route with tabs (Overview, Transcript, Chat, Insights)

**Steps:**

- [ ] **Step 1: Create MeetingDetail page**

```typescript
// Client/src/pages/MeetingDetail.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { TranscriptView } from '../components/features/TranscriptView';
import { ChatInterface } from '../components/features/ChatInterface';

const mockMeeting = {
  id: '1',
  title: 'Product Planning Q1 2026',
  source: 'youtube' as const,
  sourceUrl: 'https://youtube.com/watch?v=xyz',
  status: 'completed' as const,
  language: 'english',
  createdAt: new Date('2026-01-28'),
  transcript: 'Full transcript would go here...',
  summary: 'This meeting discussed Q1 product priorities and roadmap decisions.',
  actionItems: '1. Follow up on API design\n2. Schedule architecture review',
  keyDecisions: '1. Decided on new pricing model\n2. Approved backend refactor',
  openQuestions: '1. When to launch mobile app?',
};

export const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-3">Summary</h3>
            <p className="text-gray-700">{mockMeeting.summary}</p>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">✅ Action Items</h3>
              <p className="text-gray-700 whitespace-pre-line">{mockMeeting.actionItems}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">🔑 Key Decisions</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {mockMeeting.keyDecisions}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-3">❓ Open Questions</h3>
            <p className="text-gray-700">{mockMeeting.openQuestions}</p>
          </Card>
        </div>
      ),
    },
    {
      id: 'transcript',
      label: 'Transcript',
      content: <TranscriptView transcript={mockMeeting.transcript} />,
    },
    {
      id: 'chat',
      label: 'Chat',
      content: <ChatInterface meetingId={id || ''} />,
    },
    {
      id: 'insights',
      label: 'Insights',
      content: (
        <Card className="p-6 text-center text-gray-500">
          Insights coming soon...
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/meetings')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{mockMeeting.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mockMeeting.createdAt.toLocaleDateString()} •{' '}
            <Badge>{mockMeeting.source}</Badge>
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Button variant="outline">Export PDF</Button>
        <Button variant="outline">Share</Button>
        <Button variant="outline">Delete</Button>
      </div>

      <Tabs tabs={tabs} onChange={setActiveTab} />
    </div>
  );
};
```

- [ ] **Step 2: Create TranscriptView component**

```typescript
// Client/src/components/features/TranscriptView.tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TranscriptViewProps {
  transcript: string;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const highlightedTranscript = searchTerm
    ? transcript.replace(
        new RegExp(`(${searchTerm})`, 'gi'),
        '<mark className="bg-yellow-200">$1</mark>'
      )
    : transcript;

  return (
    <div>
      <Card className="p-6 mb-6">
        <Input
          placeholder="Search transcript..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex items-center gap-2"
        />
      </Card>

      <Card className="p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto leading-relaxed text-gray-800">
          {transcript}
        </div>
      </Card>
    </div>
  );
};
```

- [ ] **Step 3: Update App.tsx with detail route**

```typescript
// Client/src/App.tsx (modify Routes)
<Route path="/meeting/:id" element={<MeetingDetail />} />
```

- [ ] **Step 4: Test navigation**

```bash
npm run dev
```

Click on a meeting in Meetings page, verify detail page loads

- [ ] **Step 5: Commit**

```bash
git add Client/src/pages/MeetingDetail.tsx Client/src/components/features/TranscriptView.tsx Client/src/App.tsx
git commit -m "feat: add meeting detail page with tabs"
```

---

### Task 12: Chat Interface Component

**Files:**
- Create: `Client/src/components/features/ChatInterface.tsx`
- Create: `Client/src/hooks/useApi.ts`

**Interfaces:**
- Consumes: `meetingsAPI.chat()`, `ChatMessage` type
- Produces: `ChatInterface` component with message history and Q&A

**Steps:**

- [ ] **Step 1: Create useApi hook**

```typescript
// Client/src/hooks/useApi.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { meetingsAPI } from '../api/endpoints';
import { Meeting, ProcessingJob, ChatMessage, ChatRequest } from '../types/api';

export const useMeetingDetail = (meetingId: string) => {
  return useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => meetingsAPI.get(meetingId),
    enabled: !!meetingId,
  });
};

export const useMeetings = (skip = 0, limit = 20) => {
  return useQuery({
    queryKey: ['meetings', skip, limit],
    queryFn: () => meetingsAPI.list(skip, limit),
  });
};

export const useProcessingJob = (meetingId: string) => {
  return useQuery({
    queryKey: ['job', meetingId],
    queryFn: () => meetingsAPI.getProcessingJob(meetingId),
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!meetingId,
  });
};

export const useChatMutation = (meetingId: string) => {
  return useMutation({
    mutationFn: (request: ChatRequest) =>
      meetingsAPI.chat(meetingId, request),
  });
};

export const useUploadFileMutation = () => {
  return useMutation({
    mutationFn: ({ file, language }: { file: File; language: string }) =>
      meetingsAPI.uploadFile(file, language),
  });
};

export const useUploadYouTubeMutation = () => {
  return useMutation({
    mutationFn: ({ url, language }: { url: string; language: string }) =>
      meetingsAPI.uploadYouTube(url, language),
  });
};
```

- [ ] **Step 2: Create ChatInterface component**

```typescript
// Client/src/components/features/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useChatMutation } from '../../hooks/useApi';

interface Message {
  id: string;
  type: 'question' | 'answer';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  meetingId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ meetingId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = useChatMutation(meetingId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await chatMutation.mutateAsync({ question: input });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'answer',
        text: response.data.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'answer',
        text: 'Sorry, there was an error processing your question.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <Card className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ask me anything about this meeting!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${
                msg.type === 'question' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.type === 'question'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.type === 'question'
                      ? 'text-primary-200'
                      : 'text-gray-600'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader size={16} className="animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            loading={chatMutation.isPending}
            className="flex items-center gap-2"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
```

- [ ] **Step 3: Test chat interface**

```bash
npm run dev
```

Navigate to meeting detail, go to Chat tab, send a message

- [ ] **Step 4: Commit**

```bash
git add Client/src/components/features/ChatInterface.tsx Client/src/hooks/useApi.ts
git commit -m "feat: add chat interface with RAG integration"
```

---

### Task 13: Upload Processing with Progress

**Files:**
- Modify: `Client/src/pages/Upload.tsx`
- Create: `Client/src/components/features/UploadArea.tsx`
- Create: `Client/src/hooks/useMeetings.ts`

**Interfaces:**
- Consumes: `useUploadFileMutation()`, `useUploadYouTubeMutation()`
- Produces: Upload UI with file drag-drop, progress tracking, real-time status

**Steps:**

- [ ] **Step 1: Create UploadArea component**

```typescript
// Client/src/components/features/UploadArea.tsx
import React, { useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  loading?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileSelected,
  loading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <Card
      className={`p-12 text-center cursor-pointer transition-colors ${
        dragActive
          ? 'bg-primary-50 border-primary-300 border-2'
          : 'border-2 border-dashed border-gray-300'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept="video/*,audio/*"
        className="hidden"
        disabled={loading}
      />

      <Upload
        size={48}
        className={`mx-auto mb-3 ${
          dragActive ? 'text-primary-600' : 'text-gray-400'
        }`}
      />

      <p className="text-gray-600 mb-2 font-medium">
        Drag & drop your video or audio file here
      </p>
      <p className="text-gray-500 text-sm mb-4">or</p>

      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        Browse Files
      </Button>

      <div className="mt-6 flex items-gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg">
        <AlertCircle size={18} className="flex-shrink-0 mr-2" />
        <p className="text-sm">
          Max file size: 2GB. Videos up to 30 minutes are recommended.
        </p>
      </div>
    </Card>
  );
};
```

- [ ] **Step 2: Create useMeetings hook**

```typescript
// Client/src/hooks/useMeetings.ts
import { create } from 'zustand';
import { Meeting } from '../types/api';

interface MeetingStore {
  meetings: Meeting[];
  setMeetings: (meetings: Meeting[]) => void;
  addMeeting: (meeting: Meeting) => void;
  currentProcessing: string | null;
  setCurrentProcessing: (id: string | null) => void;
}

export const useMeetingStore = create<MeetingStore>((set) => ({
  meetings: [],
  setMeetings: (meetings) => set({ meetings }),
  addMeeting: (meeting) => set(state => ({ meetings: [meeting, ...state.meetings] })),
  currentProcessing: null,
  setCurrentProcessing: (id) => set({ currentProcessing: id }),
}));
```

- [ ] **Step 3: Update Upload page**

```typescript
// Client/src/pages/Upload.tsx (replace content)
import React, { useState, useEffect } from 'react';
import { YouTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { UploadArea } from '../components/features/UploadArea';
import { useUploadFileMutation, useUploadYouTubeMutation, useProcessingJob } from '../hooks/useApi';
import { useMeetingStore } from '../hooks/useMeetings';
import { useUIStore } from '../stores/uiStore';

export const Upload: React.FC = () => {
  const [method, setMethod] = useState<'file' | 'youtube'>('file');
  const [language, setLanguage] = useState('english');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const fileUpload = useUploadFileMutation();
  const youtubeUpload = useUploadYouTubeMutation();
  const { addMeeting, currentProcessing, setCurrentProcessing } = useMeetingStore();
  const { addToast } = useUIStore();

  const jobQuery = useProcessingJob(currentProcessing || '');

  useEffect(() => {
    if (jobQuery.data?.data?.status === 'completed') {
      addToast('Meeting processed successfully!', 'success');
      setCurrentProcessing(null);
      navigate(`/meeting/${currentProcessing}`);
    } else if (jobQuery.data?.data?.status === 'failed') {
      addToast('Processing failed. Please try again.', 'error');
      setCurrentProcessing(null);
    }
  }, [jobQuery.data?.data?.status]);

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    try {
      const response = await fileUpload.mutateAsync({ file, language });
      addMeeting(response.data);
      setCurrentProcessing(response.data.id);
      addToast('Upload started. Processing meeting...', 'info');
    } catch (error) {
      addToast('Upload failed. Please try again.', 'error');
    }
  };

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      addToast('Please enter a valid YouTube URL', 'error');
      return;
    }
    try {
      const response = await youtubeUpload.mutateAsync({ url: youtubeUrl, language });
      addMeeting(response.data);
      setCurrentProcessing(response.data.id);
      addToast('YouTube video queued for processing...', 'info');
      setYoutubeUrl('');
    } catch (error) {
      addToast('YouTube upload failed. Please try again.', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Upload Meeting</h1>

      {currentProcessing && jobQuery.data?.data && (
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-4">
            {jobQuery.data.data.status === 'processing' && (
              <div className="animate-spin">
                <AlertCircle size={24} className="text-blue-600" />
              </div>
            )}
            {jobQuery.data.data.status === 'completed' && (
              <CheckCircle size={24} className="text-green-600" />
            )}
            <div className="flex-1">
              <p className="font-medium text-blue-900">
                {jobQuery.data.data.current_stage === 'complete'
                  ? 'Meeting processed successfully!'
                  : `Processing: ${jobQuery.data.data.current_stage}`}
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${jobQuery.data.data.progress}%` }}
                />
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {jobQuery.data.data.progress}% complete
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-8 max-w-2xl">
        <div className="mb-6 flex gap-4">
          <Button
            variant={method === 'file' ? 'primary' : 'outline'}
            onClick={() => setMethod('file')}
          >
            Upload File
          </Button>
          <Button
            variant={method === 'youtube' ? 'primary' : 'outline'}
            onClick={() => setMethod('youtube')}
            className="flex items-center gap-2"
          >
            <YouTube size={18} />
            YouTube URL
          </Button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="english">English</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>

        {method === 'file' ? (
          <UploadArea
            onFileSelected={handleFileUpload}
            loading={fileUpload.isPending}
          />
        ) : (
          <div className="space-y-4">
            <Input
              label="YouTube URL"
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
            />
            <Button
              className="w-full"
              loading={youtubeUpload.isPending}
              onClick={handleYouTubeUpload}
            >
              Process YouTube Video
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            ℹ️ Processing typically takes 5-30 minutes depending on video length
          </p>
        </div>
      </Card>
    </div>
  );
};
```

- [ ] **Step 4: Test upload flow**

```bash
npm run dev
```

Test file upload and YouTube URL submission

- [ ] **Step 5: Commit**

```bash
git add Client/src/components/features/UploadArea.tsx Client/src/hooks/useMeetings.ts Client/src/pages/Upload.tsx
git commit -m "feat: add upload processing with progress tracking"
```

---

## Phase 4: Final Integration & Polish (Tasks 14-15)

### Task 14: Environment & API Integration Testing

**Files:**
- Modify: `Server/requirements.txt`
- Create: `Server/tests/test_api.py`
- Create: `Client/.env.example`

**Interfaces:**
- Produces: Working backend-frontend integration with basic tests

**Steps:**

- [ ] **Step 1: Ensure all dependencies are installed on backend**

```bash
cd Server
pip install -r requirements.txt
```

Expected: All packages installed successfully

- [ ] **Step 2: Start both servers**

Terminal 1:
```bash
cd Server
python -m uvicorn app:app --reload --port 8000
```

Terminal 2:
```bash
cd Client
npm run dev
```

- [ ] **Step 3: Test full flow**

1. Go to `http://localhost:5173`
2. Navigate to Upload page
3. Upload a test video or YouTube URL
4. Monitor processing progress
5. Once complete, click to view meeting
6. Test all tabs (Overview, Transcript, Chat)
7. Ask questions in Chat tab

- [ ] **Step 4: Create .env.example files**

```bash
# Server/.env.example
MISTRAL_API_KEY=your_key_here
SARVAM_API_KEY=your_key_here
WHISPER_MODEL=small
```

```bash
# Client/.env.example
VITE_API_BASE_URL=http://localhost:8000/api
```

- [ ] **Step 5: Commit**

```bash
git add Server/requirements.txt Client/.env.example Server/.env.example
git commit -m "feat: add environment configuration and integration testing"
```

---

### Task 15: Documentation & Deployment

**Files:**
- Create: `README.md` (root)
- Create: `Server/README.md`
- Create: `Client/README.md`
- Create: `DEPLOYMENT.md`

**Interfaces:**
- Produces: Complete documentation for development, testing, and deployment

**Steps:**

- [ ] **Step 1: Create root README**

```markdown
# InsightFlow AI

Meeting intelligence platform with AI-powered transcription, summarization, and RAG-based Q&A.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- FFmpeg (for audio processing)

### Setup

**Backend:**
```bash
cd Server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your API keys
python -m uvicorn app:app --reload
```

**Frontend:**
```bash
cd Client
npm install
npm run dev
```

Visit `http://localhost:5173`

## Features

- 🎥 **Upload Videos** - Local files or YouTube URLs
- 📝 **Auto Transcription** - English or Hinglish support
- 📊 **Smart Summaries** - AI-generated meeting summaries
- ✅ **Action Items** - Automatic extraction
- 🔑 **Key Decisions** - Highlighted decisions
- 💬 **RAG Chat** - Ask questions about meetings
- 📈 **Analytics** - Meeting trends and insights

## Architecture

```
Frontend (React 19 + TypeScript + TailwindCSS)
    ↓ (REST API / JSON)
FastAPI Backend
    ├─ Transcription (Whisper / Sarvam)
    ├─ Summarization (Mistral AI)
    ├─ RAG Engine (ChromaDB)
    └─ SQLite Database
```

## API Documentation

Visit `http://localhost:8000/docs` for interactive API docs (Swagger UI)

## Development

See [Server/README.md](Server/README.md) and [Client/README.md](Client/README.md)
```

- [ ] **Step 2: Create Server README**

```markdown
# InsightFlow AI - Backend

FastAPI-based meeting processing and RAG engine.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

```
MISTRAL_API_KEY=your_mistral_key
SARVAM_API_KEY=your_sarvam_key (for Hinglish)
WHISPER_MODEL=small|base|medium|large
```

## Running

```bash
python -m uvicorn app:app --reload --port 8000
```

## API Endpoints

- `POST /api/meetings` - Create meeting entry
- `POST /api/upload/file` - Upload video/audio
- `POST /api/upload/youtube` - Process YouTube URL
- `GET /api/meetings` - List all meetings
- `GET /api/meetings/{id}` - Get meeting details
- `POST /api/meetings/{id}/chat` - Chat with meeting via RAG
- `GET /api/health` - Health check

See `/docs` for full OpenAPI spec.

## Architecture

- **config.py** - Configuration management
- **models.py** - SQLAlchemy ORM models
- **schemas.py** - Pydantic request/response models
- **database.py** - Database session management
- **api/** - Route handlers
- **services/** - Business logic
- **core/** - RAG, transcription, summarization
- **utils/** - Audio processing utilities
```

- [ ] **Step 3: Create Client README**

```markdown
# InsightFlow AI - Frontend

React 19 + TypeScript + TailwindCSS frontend for meeting intelligence.

## Setup

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── api/          - API client & endpoints
├── components/   - React components
│   ├── ui/      - Base UI components
│   ├── layout/  - Layout components
│   └── features/ - Feature-specific components
├── pages/        - Route pages
├── hooks/        - Custom React hooks
├── stores/       - Zustand state management
├── types/        - TypeScript types
└── utils/        - Helper functions
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Features

- 📱 Responsive mobile-first design
- 🎨 Dark mode support (coming soon)
- ⚡ Real-time processing updates
- 💬 RAG-powered chat interface
- 📊 Meeting analytics dashboard
```

- [ ] **Step 4: Create DEPLOYMENT.md**

```markdown
# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- AWS/Azure/GCP account (optional)
- Domain name (optional)

## Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./Server
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./insightflow.db
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
      - SARVAM_API_KEY=${SARVAM_API_KEY}
    volumes:
      - ./Server/uploads:/app/uploads
      - ./Server/vector_db:/app/vector_db

  frontend:
    build: ./Client
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - VITE_API_BASE_URL=http://backend:8000/api

  db:
    image: sqlite:latest
    volumes:
      - ./data:/data
```

Run:
```bash
docker-compose up -d
```

## Production Checklist

- [ ] Set up proper database (PostgreSQL)
- [ ] Configure environment variables
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up monitoring/logging
- [ ] Configure backups
- [ ] Test error handling
- [ ] Performance testing
```

- [ ] **Step 5: Commit everything**

```bash
git add README.md Server/README.md Client/README.md DEPLOYMENT.md
git commit -m "docs: add comprehensive documentation"
```

---

## Summary

This implementation plan covers the complete InsightFlow AI platform:

**Phase 1 (Backend):** 5 tasks creating FastAPI REST API with meetings CRUD, file upload, processing, and RAG chat
**Phase 2 (Frontend Setup):** 5 tasks setting up React, dependencies, types, UI components, and routing
**Phase 3 (Core Features):** 3 tasks building meeting details, chat interface, and upload with progress
**Phase 4 (Integration):** 2 tasks for testing and documentation

**Total: 15 focused, testable tasks with exact code and commands**

Each task is independently testable and can be worked on by different team members.

---

Plan complete and saved to `docs/superpowers/plans/`. Ready for execution!

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you prefer?