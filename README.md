# InsightFlow AI

Meeting intelligence platform with AI-powered transcription, summarization, and RAG-based Q&A.

## Features

- 🎥 **Upload Videos** - Local files or YouTube URLs
- 📝 **Auto Transcription** - English or Hinglish support
- 📊 **Smart Summaries** - AI-generated meeting summaries
- ✅ **Action Items** - Automatic extraction
- 🔑 **Key Decisions** - Highlighted decisions
- 💬 **RAG Chat** - Ask questions about meetings
- 📈 **Analytics** - Meeting trends and insights

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- FFmpeg (for audio processing)

### Backend Setup

```bash
cd Server
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt

# Configure API keys in .env
cp .env.example .env
# Edit .env and add your MISTRAL_API_KEY and SARVAM_API_KEY

# Start the server
python -m uvicorn app:app --reload --port 8000
```

### Frontend Setup

```bash
cd Client
npm install
npm run dev
```

Visit `http://localhost:5173`

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

### Key Endpoints

- `POST /api/upload/file` - Upload video/audio file
- `POST /api/upload/youtube` - Process YouTube URL
- `GET /api/meetings` - List all meetings
- `GET /api/meetings/{id}` - Get meeting details
- `POST /api/meetings/{id}/chat` - Chat with meeting via RAG
- `GET /api/health` - Health check

## Development

### Backend
```bash
cd Server
python -m uvicorn app:app --reload
```

### Frontend
```bash
cd Client
npm run dev
```

## Technology Stack

**Backend:**
- FastAPI - Modern Python web framework
- SQLAlchemy - ORM for database operations
- Mistral AI - LLM for summarization and extraction
- ChromaDB - Vector database for RAG
- Whisper - Speech-to-text transcription
- Sarvam AI - Hinglish transcription

**Frontend:**
- React 19 - UI framework
- TypeScript - Type safety
- TailwindCSS - Utility-first CSS
- React Router - Client-side routing
- TanStack Query - Server state management
- Zustand - Client state management
- Recharts - Data visualization
- Lucide React - Icons

## Project Structure

```
InsightFlow AI/
├── Server/              # FastAPI backend
│   ├── api/            # API endpoints
│   ├── services/       # Business logic
│   ├── core/           # RAG, transcription, summarization
│   ├── utils/          # Utilities
│   ├── models.py       # Database models
│   ├── schemas.py      # Pydantic schemas
│   └── app.py          # FastAPI app
│
└── Client/             # React frontend
    ├── src/
    │   ├── api/        # API client
    │   ├── components/ # React components
    │   ├── pages/      # Route pages
    │   ├── stores/     # State management
    │   └── types/      # TypeScript types
    └── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@insightflow.ai
