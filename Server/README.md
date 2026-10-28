# InsightFlow AI - Backend

FastAPI-based meeting processing and RAG engine.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file:

```
MISTRAL_API_KEY=your_mistral_key
SARVAM_API_KEY=your_sarvam_key
WHISPER_MODEL=small
```

## Running

```bash
python -m uvicorn app:app --reload --port 8000
```

## API Endpoints

### Upload
- `POST /api/upload/file` - Upload video/audio file
- `POST /api/upload/youtube` - Process YouTube URL

### Meetings
- `GET /api/meetings` - List all meetings (pagination supported)
- `GET /api/meetings/{id}` - Get meeting details
- `DELETE /api/meetings/{id}` - Delete meeting
- `GET /api/meetings/{id}/job` - Get processing status

### Chat
- `POST /api/meetings/{id}/chat` - Chat with meeting via RAG

### Health
- `GET /api/health` - Health check

See `/docs` for full OpenAPI specification.

## Architecture

- **api/** - Route handlers
- **services/** - Business logic layer
- **core/** - RAG, transcription, summarization
- **utils/** - Audio processing utilities
- **models.py** - SQLAlchemy ORM models
- **schemas.py** - Pydantic request/response schemas
- **database.py** - Database configuration

## Database

SQLite database: `insightflow.db`

Models:
- `Meeting` - Meeting metadata
- `ProcessingJob` - Background job tracking

## Processing Pipeline

1. **Upload** - Save file or queue YouTube URL
2. **Download** - Extract audio (yt-dlp for YouTube)
3. **Transcribe** - Whisper (English) or Sarvam (Hinglish)
4. **Analyze** - Extract summary, action items, decisions, questions
5. **Index** - Build vector store for RAG
6. **Complete** - Mark meeting as ready

## RAG Engine

- **Vector Store**: ChromaDB
- **Embeddings**: HuggingFace all-MiniLM-L6-v2
- **LLM**: Mistral AI (mistral-small-latest)
- **Retrieval**: Top-k similarity search
