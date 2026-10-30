"""Per-meeting ChromaDB collections.

Transcript segments carry absolute timestamps ({start,end,text,chunk}); the
segment texts are split into retrieval chunks whose metadata keeps the
covering segment's start/end so chat citations can deep-link to moments.
"""

from app.config import get_settings
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

settings = get_settings()

_embeddings = None


def collection_name(meeting_id: str) -> str:
    return f"meeting_{meeting_id}"


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": settings.embedding_device},
        )
    return _embeddings


def _char_span_to_segment(segments: list[dict], starts: list[int], pos: int) -> dict:
    """Map a char offset into the segment that contains it (binary search)."""
    lo, hi = 0, len(starts) - 1
    best = 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if starts[mid] <= pos:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return segments[best]


def build_vector_store(meeting_id: str, transcript: str, segments: list[dict]) -> Chroma:
    """Create (re)the collection for one meeting and index the transcript."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    if segments:
        # Build char-index bookkeeping so each sub-chunk inherits timestamps.
        docs: list[Document] = []
        starts: list[int] = []
        pos = 0
        cursor = 0
        for seg in segments:
            seg_text = seg["text"]
            # locate this segment's text in the joined transcript
            idx = transcript.find(seg_text, cursor)
            if idx == -1:
                idx = pos
            starts.append(idx)
            pos = idx + len(seg_text)
            cursor = idx + 1

        for chunk_text in splitter.split_text(transcript):
            midpoint = transcript.find(chunk_text)
            if midpoint == -1:
                midpoint = 0
            seg = _char_span_to_segment(segments, starts, midpoint)
            docs.append(
                Document(
                    page_content=chunk_text,
                    metadata={
                        "start": seg["start"],
                        "end": seg["end"],
                        "chunk": seg.get("chunk", 0),
                    },
                )
            )

        if not docs:
            docs = [Document(page_content=transcript, metadata={})]
    else:
        docs = [Document(page_content=p, metadata={}) for p in splitter.split_text(transcript)]

    store = Chroma.from_documents(
        documents=docs,
        embedding=get_embeddings(),
        collection_name=collection_name(meeting_id),
        persist_directory=str(settings.vector_db_dir),
    )
    return store


def load_vector_store(meeting_id: str) -> Chroma | None:
    """Return the persisted collection, or None if it doesn't exist."""
    store = Chroma(
        collection_name=collection_name(meeting_id),
        embedding_function=get_embeddings(),
        persist_directory=str(settings.vector_db_dir),
    )
    try:
        if store._collection.count() == 0:
            return None
    except Exception:
        return None
    return store


def delete_vector_store(meeting_id: str) -> None:
    client = Chroma(
        collection_name=collection_name(meeting_id),
        embedding_function=get_embeddings(),
        persist_directory=str(settings.vector_db_dir),
    )._client
    collection_names = {
        item.name if hasattr(item, "name") else item
        for item in client.list_collections()
    }
    if collection_name(meeting_id) in collection_names:
        client.delete_collection(collection_name(meeting_id))


def get_retriever(store: Chroma, k: int | None = None):
    return store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k or settings.retrieval_k},
    )
