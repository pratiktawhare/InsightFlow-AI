import os

import yt_dlp
from pydub import AudioSegment

from app.config import get_settings

settings = get_settings()

DOWNLOAD_DIR = str(settings.downloads_dir)
UPLOAD_DIR = str(settings.uploads_dir)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)


def download_youtube_audio(url: str) -> str:
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    output_path = os.path.join(DOWNLOAD_DIR, "%(id)s.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
        "quiet": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
    base, _ext = os.path.splitext(filename)
    wav_path = base + ".wav"
    if os.path.exists(wav_path):
        return wav_path
    return filename


def convert_to_wav(input_path: str) -> str:
    """Convert any audio/video file to 16kHz mono WAV using pydub."""
    output_path = os.path.splitext(input_path)[0] + "_converted.wav"
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio.export(output_path, format="wav")
    return output_path


def chunk_audio(wav_path: str, chunk_minutes: int | None = None) -> list[str]:
    minutes = chunk_minutes or settings.chunk_minutes
    audio = AudioSegment.from_wav(wav_path)
    chunk_ms = minutes * 60 * 1000

    chunks: list[str] = []
    for i, start in enumerate(range(0, len(audio), chunk_ms)):
        chunk = audio[start : start + chunk_ms]
        chunk_path = f"{wav_path}_chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)
    return chunks


def prepare_source(source_path: str, language: str = "english") -> list[str]:
    wav_path = convert_to_wav(source_path)
    return chunk_audio(wav_path)


def audio_duration_seconds(wav_path: str) -> float:
    try:
        return len(AudioSegment.from_wav(wav_path)) / 1000.0
    except Exception:
        return 0.0
