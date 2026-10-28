from sqlalchemy.orm import Session
from models import Meeting
from core.rag_engine import build_rag_chain, ask_question

class RAGService:
    _rag_chains = {}  # In-memory cache of RAG chains

    @staticmethod
    def get_or_build_chain(db: Session, meeting_id: str):
        """Get or build RAG chain for a meeting"""
        if meeting_id in RAGService._rag_chains:
            return RAGService._rag_chains[meeting_id]

        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting or not meeting.transcript:
            raise ValueError("Meeting not found or transcript missing")

        chain = build_rag_chain(meeting.transcript)
        RAGService._rag_chains[meeting_id] = chain
        return chain

    @staticmethod
    def query(db: Session, meeting_id: str, question: str) -> str:
        """Query meeting via RAG"""
        chain = RAGService.get_or_build_chain(db, meeting_id)
        answer = ask_question(chain, question)
        return answer

    @staticmethod
    def clear_chain(meeting_id: str):
        """Clear cached chain for a meeting"""
        if meeting_id in RAGService._rag_chains:
            del RAGService._rag_chains[meeting_id]
