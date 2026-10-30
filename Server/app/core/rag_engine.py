"""Chat-with-meeting RAG, with streaming output and source citations."""

from typing import Iterator

from langchain_core.prompts import ChatPromptTemplate

from app.config import get_settings
from app.core.summarizer import get_llm
from app.core.vector_store import load_vector_store

settings = get_settings()

SYSTEM_PROMPT = """You are an expert meeting assistant. Answer the user's question
based ONLY on the meeting/video transcript context provided below.

If the answer is not found in the context, say:
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.
You may format the answer with short paragraphs or bullets when helpful.

Context from meeting transcript:
{context}"""


def load_rag_pieces(meeting_id: str):
    """Return (store, llm, prompt) or (None, ..., ...) if not indexed yet."""
    store = load_vector_store(meeting_id)
    if store is None:
        return None
    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT), ("human", "{question}")]
    )
    llm = get_llm(0.2)
    return store, llm, prompt


def get_sources(meeting_id: str, question: str, k: int | None = None) -> list[dict]:
    """Retrieve the k most relevant chunks with their timestamps."""
    store = load_vector_store(meeting_id)
    if store is None:
        return []
    docs = store.similarity_search(question, k=k or settings.retrieval_k)
    sources = []
    for i, d in enumerate(docs):
        sources.append(
            {
                "index": i,
                "text": d.page_content,
                "start": d.metadata.get("start"),
                "end": d.metadata.get("end"),
                "chunk": d.metadata.get("chunk"),
            }
        )
    return sources


def _format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)


def stream_rag_answer(meeting_id: str, question: str) -> Iterator[str]:
    """Yield answer text deltas for the question, grounded in the transcript."""
    pieces = load_rag_pieces(meeting_id)
    if pieces is None:
        yield "The meeting transcript is still being processed. Please try again in a moment."
        return

    store, llm, prompt = pieces
    docs = store.similarity_search(question, k=settings.retrieval_k)
    context = _format_docs(docs)

    chain = prompt | llm
    for delta in chain.stream({"context": context, "question": question}):
        if delta.content:
            yield delta.content
