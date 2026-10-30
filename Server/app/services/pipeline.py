"""Background processing pipeline with progress publication."""

import json
import os
import threading
import traceback

from app.config import get_settings
from app.core.summarizer import (
    extract_action_items,
    extract_key_decisions,
    extract_questions,
    generate_title,
    summarize,
)
from app.core.transcriber import transcribe_all
from app.core import vector_store as vs
from app.db import LocalSessionFactory
from app.models import Meeting
from app.progress import publish
from app.utils import audio_processor as ap
from app.utils.storage import delete_meeting_files

settings = get_settings()

# rough share of total wall time per stage (used for progress %)
STAGE_WEIGHTS = {
    "download": (0.0, 0.05),
    "prepare": (0.05, 0.10),
    "transcribe": (0.10, 0.72),
    "summarize": (0.72, 0.84),
    "extract": (0.84, 0.92),
    "index": (0.92, 1.00),
}


def _emit(meeting_id: str, status: str, stage: str, progress: float, detail: str = "") -> None:
    publish(
        meeting_id,
        {
            "meeting_id": meeting_id,
            "status": status,
            "stage": stage,
            "progress": round(min(max(progress, 0.0), 1.0), 4),
            "detail": detail,
        },
    )
    # write-through to DB so refresh still shows state
    db = LocalSessionFactory()
    try:
        m = db.get(Meeting, meeting_id)
        if m:
            m.status = status
            m.stage = stage
            m.progress = round(min(max(progress, 0.0), 1.0), 4)
            if detail:
                m.stage = f"{stage}:{detail}" if stage != "transcribe" else stage
            db.commit()
    except Exception:
        traceback.print_exc()
    finally:
        db.close()


def _fail(meeting_id: str, message: str) -> None:
    db = LocalSessionFactory()
    try:
        m = db.get(Meeting, meeting_id)
        if m:
            m.status = "failed"
            m.stage = "error"
            m.error = message[:2000]
            m.progress = 1.0
            db.commit()
    finally:
        db.close()
    _emit(meeting_id, "failed", "error", 1.0, message[:200])


def _run(meeting_id: str, language: str, youtube_url: str | None, source_path: str | None) -> None:
    emit = _emit
    try:
        # 1 — download/prepare
        if youtube_url:
            emit(meeting_id, "processing", "download", 0.02)
            source_path = ap.download_youtube_audio(youtube_url)
            emit(meeting_id, "processing", "download", 0.05, "audio downloaded")
        if not source_path:
            raise RuntimeError("No audio source was provided.")
        emit(meeting_id, "processing", "prepare", 0.07)
        wav_path = (
            source_path
            if os.path.splitext(source_path)[1].lower() == ".wav"
            else ap.convert_to_wav(source_path)
        )
        chunks = ap.chunk_audio(wav_path)
        duration = ap.audio_duration_seconds(wav_path)
        emit(meeting_id, "processing", "prepare", 0.10, f"{len(chunks)} audio chunks")

        # 2 — transcribe with per-chunk progress
        transcript, segments = transcribe_all(
            chunks,
            language,
            on_chunk_done=lambda done, total: emit(
                meeting_id, "processing", "transcribe", 0.10 + (done / total) * 0.62, f"Transcribing {done}/{total}"
            ),
        )

        if not transcript.strip():
            raise RuntimeError(
                "No speech detected in the audio. Try a different file, or check the audio encoding."
            )

        # 3 — LLM analysis
        emit(meeting_id, "processing", "summarize", 0.78, "Generating summary")
        title = generate_title(transcript)
        summary = summarize(transcript)

        emit(meeting_id, "processing", "extract", 0.86, "Extracting insights")
        actions = extract_action_items(transcript)
        decisions = extract_key_decisions(transcript)
        questions = extract_questions(transcript)

        emit(meeting_id, "processing", "index", 0.94, "Building knowledge index")
        vs.build_vector_store(meeting_id, transcript, segments)

        # 4 — persist final results
        db = LocalSessionFactory()
        try:
            m = db.get(Meeting, meeting_id)
            if m:
                m.title = title or m.title
                m.transcript = transcript[: settings.max_transcript_chars]
                m.summary = summary
                m.segments = segments[:4000]
                m.decisions = decisions
                m.open_questions = questions
                m.duration_seconds = duration
                m.word_count = len(transcript.split())
                m.chunk_count = len(chunks)
                m.status = "ready"
                m.stage = "ready"
                m.progress = 1.0
                # structured action items
                from app.models import Task

                m.tasks = [
                    Task(
                        meeting_id=m.id,
                        description=(a.get("task") or "").strip()[:2000] or "(unspecified task)",
                        owner=(a.get("owner") or "Not specified").strip()[:120] or "Not specified",
                        deadline=(a.get("deadline") or "Not specified").strip()[:120] or "Not specified",
                        order_index=i,
                    )
                    for i, a in enumerate(actions)
                ]
                db.commit()
        finally:
            db.close()

        _emit(meeting_id, "ready", "ready", 1.0)
        print(f"[pipeline] Meeting {meeting_id} ready.")

        # free disk: raw media is no longer needed once results are persisted
        try:
            delete_meeting_files(meeting_id, youtube_url)
            print(f"[pipeline] Cleaned up source media for {meeting_id}.")
        except Exception as cleanup_exc:
            print(f"[pipeline] Post-success cleanup failed for {meeting_id}: {cleanup_exc}")

    except Exception as e:
        traceback.print_exc()
        _fail(meeting_id, str(e))
    finally:
        # cleanup chunk files but keep the converted wav for possible re-use
        try:
            if "wav_path" in locals() and os.path.exists(wav_path):
                import glob

                for f in glob.glob(wav_path + "_chunk_*.wav"):
                    os.remove(f)
        except Exception:
            pass


def start_pipeline(meeting_id: str, language: str, youtube_url: str | None, source_path: str | None) -> threading.Thread:
    t = threading.Thread(
        target=_run,
        args=(meeting_id, language, youtube_url, source_path),
        name=f"pipeline-{meeting_id}",
        daemon=True,
    )
    t.start()
    return t
