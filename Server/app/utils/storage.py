"""Cleanup helpers for meeting-owned files."""

import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from app.config import get_settings

settings = get_settings()


def _youtube_id(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    if parsed.hostname in {"youtu.be", "www.youtu.be"}:
        return parsed.path.strip("/").split("/")[0] or None
    video_id = parse_qs(parsed.query).get("v", [None])[0]
    if video_id:
        return video_id
    match = re.search(r"/(?:shorts|embed|live)/([^/?#]+)", parsed.path)
    return match.group(1) if match else None


def delete_meeting_files(meeting_id: str, source_url: str | None = None) -> None:
    """Delete files owned by a meeting from upload and download storage."""
    paths: list[Path] = []
    for directory in (settings.uploads_dir,):
        paths.extend(path for path in directory.glob(f"{meeting_id}*") if path.is_file())

    video_id = _youtube_id(source_url)
    if video_id:
        paths.extend(path for path in settings.downloads_dir.glob(f"{video_id}.*") if path.is_file())

    failures: list[str] = []
    for path in set(paths):
        try:
            path.unlink()
        except OSError as exc:
            failures.append(f"{path}: {exc}")

    if failures:
        raise RuntimeError("Could not delete meeting files: " + "; ".join(failures))
