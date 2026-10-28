from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import ChatRequest, ChatMessage
from services.rag_service import RAGService

router = APIRouter(prefix="/api/meetings/{meeting_id}/chat", tags=["chat"])

@router.post("", response_model=ChatMessage)
async def chat_with_meeting(
    meeting_id: str,
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Chat with meeting transcript via RAG"""
    try:
        answer = RAGService.query(db, meeting_id, request.question)
        return ChatMessage(question=request.question, answer=answer)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
