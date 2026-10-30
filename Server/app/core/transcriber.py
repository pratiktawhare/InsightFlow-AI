"""Transcription: faster-whisper (local, English) | Sarvam AI (Hinglish -> English).

Returns segment-level [{"start","end","text","chunk"}] so the frontend can
deep-link quotes to exact audio/video moments.
"""

import os
import threading
from typing import Callable

import requests
from pydub import AudioSegment

from app.config import get_settings

settings = get_settings()

SARVAM_PIECE_SECONDS = settings.sarvam_piece_seconds
SARVAM_API_KEY = settings.sarvam_api_key

_model = None
_model_lock = threading.Lock()


def load_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                print(f"Loading faster-whisper model: {settings.whisper_model} (int8, cpu)...")
                _model = WhisperModel(
                    settings.whisper_model,
                    device="cpu",
                    compute_type="int8",
                )
                print("faster-whisper model loaded.")
    return _model


def transcribe_chunk_whisper(chunk_path: str, chunk_index: int = 0) -> list[dict]:
    model = load_model()
    segments_out: list[dict] = []
    segments, _info = model.transcribe(
        chunk_path,
        language=settings.transcribe_language,
        beam_size=5,
        vad_filter=True,
    )
    offset = chunk_index * settings.chunk_minutes * 60
    for seg in segments:
        text = (seg.text or "").strip()
        if text:
            segments_out.append(
                {
                    "start": round(offset + seg.start, 2),
                    "end": round(offset + seg.end, 2),
                    "text": text,
                    "chunk": chunk_index,
                }
            )
    return segments_out


def _send_to_sarvam(piece_path: str) -> str:
    headers = {"api-subscription-key": SARVAM_API_KEY}
    with open(piece_path, "rb") as f:
        files = {"file": (os.path.basename(piece_path), f, "audio/wav")}
        data = {"model": settings.sarvam_stt_model, "with_diarization": "false"}
        response = requests.post(
            settings.sarvam_stt_translate_url,
            headers=headers,
            files=files,
            data=data,
            timeout=120,
        )
    if not response.ok:
        print(f"Sarvam returned {response.status_code}: {response.text}")
        response.raise_for_status()
    return response.json().get("transcript", "")


def transcribe_chunk_sarvam(chunk_path: str, chunk_index: int = 0) -> list[dict]:
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not set in environment / .env")

    audio = AudioSegment.from_wav(chunk_path)
    piece_ms = SARVAM_PIECE_SECONDS * 1000
    offset = chunk_index * settings.chunk_minutes * 60

    segments_out: list[dict] = []
    total_pieces = (len(audio) + piece_ms - 1) // piece_ms

    for i, start_ms in enumerate(range(0, len(audio), piece_ms)):
        piece = audio[start_ms : start_ms + piece_ms]
        piece_path = f"{chunk_path}_sv_{i}.wav"
        piece.export(piece_path, format="wav")
        try:
            text = _send_to_sarvam(piece_path).strip()
            if text:
                start_s = offset + start_ms / 1000
                end_s = offset + (start_ms + piece_ms) / 1000
                segments_out.append({"start": round(start_s, 2), "end": round(end_s, 2), "text": text, "chunk": chunk_index})
        finally:
            if os.path.exists(piece_path):
                os.remove(piece_path)
    return segments_out


def transcribe_chunk(chunk_path: str, language: str = "english", chunk_index: int = 0) -> list[dict]:
    if language.lower() == "hinglish":
        return transcribe_chunk_sarvam(chunk_path, chunk_index)
    return transcribe_chunk_whisper(chunk_path, chunk_index)


def transcribe_all(
    chunks: list[str],
    language: str = "english",
    on_chunk_done: Callable[[int, int], None] | None = None,
) -> tuple[str, list[dict]]:
    """Transcribe all chunks. Returns (full_text, segments)."""
    full_text = ""
    all_segments: list[dict] = []
    engine = "Sarvam AI" if language.lower() == "hinglish" else "Whisper (faster-whisper)"
    print(f"Using {engine} for transcription.")

    for i, chunk in enumerate(chunks):
        segs = transcribe_chunk(chunk, language=language, chunk_index=i)
        all_segments.extend(segs)
        full_text += " ".join(s["text"] for s in segs) + " "
        if on_chunk_done:
            on_chunk_done(i + 1, len(chunks))

    print("Transcription complete.")
    return full_text.strip(), all_segments
