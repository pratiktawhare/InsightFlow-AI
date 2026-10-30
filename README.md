# InsightFlow AI

RAG-powered meeting & video intelligence. Upload an audio recording or a YouTube URL and get a full transcript, structured summary, action items, PDF export, and a chat interface that answers questions grounded in the transcript.

## Features

- **Audio ingestion** — Upload audio/video files or paste a YouTube link (downloaded via `yt-dlp`)
- **Automatic transcription** — Chunked audio processing with `faster-whisper`, plus Hindi → English translation via the Sarvam speech API
- **Smart summaries** — Groq-hosted open-source LLMs (via LangChain) generate summaries, key points, and discussion topics
- **Action item extraction** — Automatically detects and tracks tasks from the conversation with owner and due date
- **RAG chat** — Query any meeting with natural-language questions; answers are grounded in transcript chunks stored in ChromaDB with HuggingFace sentence embeddings
- **Live progress streaming** — Processing stages stream to the UI in real time over Server-Sent Events
- **Export** — Download summaries, transcripts, and analysis as PDF (ReportLab) or Markdown
- **Dashboard** — Meeting history, status tracking, and task overview built with React and Recharts

## Architecture

```
┌─────────────────────────────┐
│  Client (React 19 + Vite)   │
│  TanStack Query • Zustand   │
│  Tailwind CSS v4 • Recharts │
└─────────────┬───────────────┘
              │ /api (Vite dev proxy)
┌─────────────▼───────────────────────────────────────┐
│  Server (FastAPI + SQLAlchemy + SQLite)             │
│                                                     │
│  Pipeline: ingest → audio chunking (pydub)          │
│    → transcription (faster-whisper / Sarvam)        │
│    → summarization + task extraction (Groq LLM)     │
│    → embeddings (all-MiniLM-L6-v2) → ChromaDB       │
│    → export (ReportLab)                             │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

**Client**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Zustand, React Router v7, Framer Motion, Recharts, react-markdown, Sonner

**Server**: Python 3.12, FastAPI, SQLAlchemy 2, SSE-Starlette, LangChain, Groq (`openai/gpt-oss-120b` by default), faster-whisper, Sarvam AI (translation), ChromaDB, sentence-transformers, yt-dlp, pydub, ReportLab

## Project Structure

```
InsightFlow AI/
├── Client/                  # React frontend
│   └── src/
│       ├── api/             # Typed API client, hooks, types
│       ├── components/      # UI components
│       ├── pages/           # Landing, Dashboard, NewMeeting, MeetingDetail, Tasks
│       ├── store/           # Zustand state
│       └── hooks/           # SSE stream consumers
└── Server/                  # FastAPI backend
    ├── main.py              # App entry point
    ├── app/
    │   ├── routers/         # meetings, chat, tasks, exports
    │   ├── services/        # processing pipeline, chat, export
    │   ├── core/            # transcriber, summarizer, RAG, vector store
    │   ├── utils/           # audio processing, storage
    │   ├── models.py        # SQLAlchemy models
    │   └── config.py        # Settings (pydantic-settings)
    └── requirements.txt
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12
- A [Groq API key](https://console.groq.com/keys) (required)
- A [Sarvam API key](https://dashboard.sarvam.ai/) (optional, for Hindi → English translation)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/insightflow-ai.git
cd insightflow-ai
```

### 2. Set up the server

```bash
cd Server
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS/Linux

# Create Server/.env
GROQ_API_KEY=your_groq_api_key
SARVAM_API_KEY=your_sarvam_api_key   # optional
# Optional overrides:
# GROQ_MODEL=openai/gpt-oss-120b
# WHISPER_MODEL=small
# EMBEDDING_MODEL=all-MiniLM-L6-v2
```

Start the API:

```bash
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

### 3. Set up the client

```bash
cd Client
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` requests to the backend with SSE-friendly settings.

### 4. Production build

```bash
cd Client
npm run build     # type-checks and bundles to dist/
npm run preview
```

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/meetings` | Create a meeting (audio upload or YouTube URL) |
| GET | `/api/meetings` | List meetings |
| GET | `/api/meetings/{id}` | Full meeting detail, transcript, tasks |
| GET | `/api/meetings/{id}/progress` | SSE stream of pipeline progress |
| POST | `/api/meetings/{id}/chat` | Streaming RAG chat answer |
| GET/POST/PATCH | `/api/tasks` | List / manage extracted action items |
| GET | `/api/meetings/{id}/export` | Download export (`.pdf` / `.md`) |

## Configuration Reference

All settings live in `Server/app/config.py` and can be overridden with environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | — | Groq API key (required for LLM features) |
| `SARVAM_API_KEY` | — | Sarvam key for Hindi → English translation |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | LLM used for summary/tasks/chat |
| `WHISPER_MODEL` | `small` | faster-whisper transcription model size |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence embedding model for RAG |
| `CHUNK_MINUTES` | `10` | Audio chunk length before transcription |
| `RETRIEVAL_K` | `4` | Number of chunks retrieved per chat query |

## License

MIT
