import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


def get_llm(temperature: float = 0.1, max_tokens: Optional[int] = None):
    """
    Centralized LLM Factory.
    Defaults to Groq (llama-3.1-8b-instant) without changing current model behavior.
    Supports switching to OpenAI (ChatGPT) via environment variable LLM_PROVIDER=openai.
    """
    provider = os.getenv("LLM_PROVIDER", "groq").lower().strip()

    if provider == "openai":
        try:
            from langchain_openai import ChatOpenAI
            api_key = os.getenv("OPENAI_API_KEY")
            model_name = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")
            kwargs = {
                "api_key": api_key,
                "model": model_name,
                "temperature": temperature,
            }
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            return ChatOpenAI(**kwargs, reasoning_effort="low")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI LLM ({e}). Falling back to Groq.")

    # Default active provider: Groq (llama-3.1-8b-instant)
    from langchain_groq import ChatGroq
    api_key = os.getenv("GROQ_API_KEY")
    model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    kwargs = {
        "api_key": api_key,
        "model": model_name,
        "temperature": temperature,
    }
    if max_tokens:
        kwargs["max_tokens"] = max_tokens
    return ChatGroq(**kwargs)
