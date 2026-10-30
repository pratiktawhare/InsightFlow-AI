"""PDF (reportlab) and Markdown export of meeting minutes."""

import io
import re
from html import unescape

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.models import Meeting


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", unescape(text or "")).strip()


def meeting_markdown(meeting: Meeting) -> str:
    lines: list[str] = [
        f"# {meeting.title}",
        "",
        f"- Source: {meeting.source_url or meeting.file_name or 'local'}",
        f"- Language: {meeting.language}",
        f"- Duration: {meeting.duration_seconds:.0f}s" if meeting.duration_seconds else "- Duration: n/a",
        f"- Words: {meeting.word_count}",
        "",
        "## Summary",
        "",
        meeting.summary or "_No summary._",
        "",
        "## Action Items",
        "",
    ]
    if meeting.tasks:
        for i, t in enumerate(meeting.tasks, 1):
            lines.append(f"{i}. {t.description} — **Owner:** {t.owner} — **Deadline:** {t.deadline} — **Status:** {'Done' if t.done else 'Open'}")
    else:
        lines.append("_No action items._")
    lines += ["", "## Key Decisions", ""]
    lines += [f"- {d}" for d in (meeting.decisions or [])] or ["_No key decisions._"]
    lines += ["", "## Open Questions", ""]
    lines += [f"- {q}" for q in (meeting.open_questions or [])] or ["_No open questions._"]
    lines += ["", "## Transcript", ""]
    for seg in meeting.segments or []:
        ts = seg.get("start", 0)
        mm, ss = int(ts // 60), int(ts % 60)
        lines.append(f"**[{mm:02d}:{ss:02d}]** {_clean(seg['text'])}")
    if not meeting.segments:
        lines.append(meeting.transcript or "_No transcript._")
    return "\n".join(lines)


def meeting_pdf(meeting: Meeting) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title=meeting.title, author="InsightFlow AI")
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("H1x", parent=styles["Heading1"], fontSize=20, spaceAfter=6)
    h2 = ParagraphStyle("H2x", parent=styles["Heading2"], fontSize=14, spaceBefore=12, textColor="#312e81")
    body = styles["BodyText"]
    small = ParagraphStyle("Smallx", parent=styles["BodyText"], fontSize=9, textColor="#6b7280")

    story: list = [Paragraph(_clean(meeting.title), h1), Spacer(1, 0.2 * cm)]
    meta = f"Source: {meeting.source_url or meeting.file_name or 'local file'} • Language: {meeting.language} • Words: {meeting.word_count}"
    story.append(Paragraph(meta, small))

    story.append(Paragraph("Summary", h2))
    for bullet in (meeting.summary or "").splitlines():
        line = _clean(bullet.lstrip("*-• "))
        if line:
            story.append(Paragraph(f"• {line}", body))

    story.append(Paragraph("Action Items", h2))
    if meeting.tasks:
        for i, t in enumerate(meeting.tasks, 1):
            story.append(
                Paragraph(f"{i}. {_clean(t.description)} <font size=9><b>Owner:</b> {_clean(t.owner)} — <b>Deadline:</b> {_clean(t.deadline)}</font>", body)
            )
    else:
        story.append(Paragraph("No action items.", small))

    story.append(Paragraph("Key Decisions", h2))
    for d in meeting.decisions or []:
        story.append(Paragraph(f"• {_clean(d)}", body))
    if not meeting.decisions:
        story.append(Paragraph("No key decisions recorded.", small))

    story.append(Paragraph("Open Questions", h2))
    for q in meeting.open_questions or []:
        story.append(Paragraph(f"• {_clean(q)}", body))
    if not meeting.open_questions:
        story.append(Paragraph("No open questions.", small))

    story.append(Paragraph("Transcript", h2))
    if meeting.segments:
        for seg in meeting.segments:
            ts = seg.get("start", 0)
            mm, ss = int(ts // 60), int(ts % 60)
            story.append(Paragraph(f"<b>[{mm:02d}:{ss:02d}]</b> {_clean(seg['text'])}", small))
    else:
        story.append(Paragraph(_clean(meeting.transcript) or "No transcript.",small))

    doc.build(story)
    return buf.getvalue()


def safe_filename(title: str, ext: str) -> str:
    base = re.sub(r"[^\w\- ]", "", title or "meeting").strip() or "meeting"
    return f"{base[:64]}.{ext}"
