import json
import os

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

settings = get_settings()


def get_llm(temperature: float | None = None):
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set (.env)")
    return ChatGroq(
        model=settings.groq_model,
        groq_api_key=os.environ.get("GROQ_API_KEY", settings.groq_api_key),
        temperature=temperature if temperature is not None else settings.llm_temperature,
    )


def split_transcript(transcript: str, chunk_size: int = 3000, overlap: int = 200) -> list[str]:
    if len(transcript) <= chunk_size:
        return [transcript]
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
    return splitter.split_text(transcript)


def summarize(transcript: str) -> str:
    """Map-reduce summarization into a professional bullet-point summary."""
    llm = get_llm(0.3)

    map_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "Summarize this portion of a meeting transcript concisely."),
            ("human", "{text}"),
        ]
    )
    map_chain = map_prompt | llm | StrOutputParser()

    reduce_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert meeting summarizer. Combine these partial summaries "
                "into one final professional meeting summary using clear bullet points "
                "(* ...). Do not invent facts.",
            ),
            ("human", "{text}"),
        ]
    )

    chunks = split_transcript(transcript)
    if len(chunks) == 1:
        final_chain = (
            RunnablePassthrough()
            | RunnableLambda(lambda x: {"text": x})
            | ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are an expert meeting summarizer. Write a professional "
                        "summary of this transcript as bullet points (* ...). "
                        "Do not invent facts.",
                    ),
                    ("human", "{text}"),
                ]
            )
            | llm
            | StrOutputParser()
        )
        return final_chain.invoke(chunks[0])

    partial = [map_chain.invoke({"text": c}) for c in chunks]
    combined = "\n\n".join(partial)
    reduce_chain = reduce_prompt | llm | StrOutputParser()
    return reduce_chain.invoke(combined)


def generate_title(transcript: str) -> str:
    llm = get_llm(0.4)
    chain = (
        RunnablePassthrough()
        | RunnableLambda(lambda x: {"text": x})
        | ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Based on the meeting or video transcript, generate a short professional "
                    "title (max 8 words). Return ONLY the title, nothing else.",
                ),
                ("human", "{text}"),
            ]
        )
        | llm
        | StrOutputParser()
    )
    title = chain.invoke(transcript[:2000] or "Untitled").strip().strip('"')
    return title[:120] if title else "Untitled meeting"


def _extract_json_array(raw: str) -> list:
    if raw.strip() == "[]":
        return []
    text = raw.strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            data = data.get("items", [])
        return [i for i in data if isinstance(i, dict)] if all(isinstance(i, dict) for i in (data or [])) else []
    except json.JSONDecodeError:
        return []


def extract_action_items(transcript: str) -> list[dict]:
    """[{task, owner, deadline}] parsed from LLM JSON."""
    llm = get_llm(0.1)
    chain = (
        RunnablePassthrough()
        | RunnableLambda(lambda x: {"text": x})
        | ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are an expert meeting analyst. From the transcript, extract every "
                    'action item. Respond with ONLY a JSON array, each item: '
                    '{{"task": string, "owner": string, "deadline": string}}. '
                    'Use "Not specified" when unknown. If none, respond []',
                ),
                ("human", "{text}"),
            ]
        )
        | llm
        | StrOutputParser()
    )
    return _extract_json_array(chain.invoke(transcript))


def extract_key_decisions(transcript: str) -> list[str]:
    llm = get_llm(0.1)
    chain = (
        RunnablePassthrough()
        | RunnableLambda(lambda x: {"text": x})
        | ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are an expert meeting analyst. Extract every key decision made. "
                    "Respond with ONLY a JSON array of strings. If none, respond []",
                ),
                ("human", "{text}"),
            ]
        )
        | llm
        | StrOutputParser()
    )
    try:
        parsed = json.loads(chain.invoke(transcript).strip())
        return [str(x) for x in parsed] if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def extract_questions(transcript: str) -> list[str]:
    llm = get_llm(0.1)
    chain = (
        RunnablePassthrough()
        | RunnableLambda(lambda x: {"text": x})
        | ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "From the transcript, extract unresolved questions or topics needing "
                    "follow-up. Respond with ONLY a JSON array of strings. If none, respond []",
                ),
                ("human", "{text}"),
            ]
        )
        | llm
        | StrOutputParser()
    )
    try:
        parsed = json.loads(chain.invoke(transcript).strip())
        return [str(x) for x in parsed] if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []
