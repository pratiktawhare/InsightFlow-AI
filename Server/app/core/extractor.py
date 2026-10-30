"""Structured extraction (re-exports from app.core.summarizer)."""

from app.core.summarizer import (
    extract_action_items,
    extract_key_decisions,
    extract_questions,
    get_llm,
)

__all__ = ["extract_action_items", "extract_key_decisions", "extract_questions", "get_llm"]
