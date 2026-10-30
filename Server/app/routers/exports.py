from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Meeting
from app.services import export_service as ex

router = APIRouter(prefix="/api/meetings/{meeting_id}/export", tags=["export"])


@router.get("")
def export_meeting(meeting_id: str, format: str = "pdf", db: Session = Depends(get_db)):
    """Download meeting minutes as PDF (reportlab) or Markdown."""
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    fmt = format.lower()
    if fmt == "pdf":
        return Response(
            content=ex.meeting_pdf(meeting),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{ex.safe_filename(meeting.title, "pdf")}"'},
        )
    if fmt in ("md", "markdown"):
        md = ex.meeting_markdown(meeting)
        return Response(
            content=md.encode("utf-8"),
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{ex.safe_filename(meeting.title, "md")}"'},
        )
    raise HTTPException(400, "format must be 'pdf' or 'md'")
