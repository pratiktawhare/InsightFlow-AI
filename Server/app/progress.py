"""Thread-safe in-process progress bus.

The pipeline runs in a background thread; SSE subscribers attach per meeting
id and receive every status update. State is also persisted to the DB by the
pipeline so restarts keep a consistent snapshot.
"""

import queue
import threading

_lock = threading.Lock()
_state: dict[str, dict] = {}          # meeting_id -> latest snapshot
_subs: dict[str, set["queue.Queue"]] = {}  # meeting_id -> subscriber queues


def publish(meeting_id: str, payload: dict) -> None:
    """Called from pipeline threads with a snapshot, e.g.
    {"status": ..., "stage": ..., "progress": ..., "detail": ...}
    """
    with _lock:
        _state[meeting_id] = payload
        for q in list(_subs.get(meeting_id, set())):
            try:
                q.put_nowait(payload)
            except queue.Full:
                pass


def subscribe(meeting_id: str) -> "queue.Queue":
    q: "queue.Queue" = queue.Queue(maxsize=256)
    with _lock:
        _subs.setdefault(meeting_id, set()).add(q)
        current = _state.get(meeting_id)
    if current is not None:
        q.put_nowait(current)
    return q


def unsubscribe(meeting_id: str, q: "queue.Queue") -> None:
    with _lock:
        subs = _subs.get(meeting_id)
        if subs is not None:
            subs.discard(q)
            if not subs and meeting_id in _state and _state[meeting_id].get("status") in ("ready", "failed"):
                _state.pop(meeting_id, None)


def snapshot(meeting_id: str) -> dict | None:
    with _lock:
        return _state.get(meeting_id)
