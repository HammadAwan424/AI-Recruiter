import os
from typing import TypedDict, Optional
from dotenv import load_dotenv
from app.utils.llm_factory import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, END

from app.schemas.screening import (
    ScreeningLLMOutput,
    EvidenceSet,
    EvidenceBlock,
)
from app.agents.screening.prompts import (
    SCREENING_SYSTEM_PROMPT,
    build_screening_user_prompt
)

load_dotenv()


class EvaluationState(TypedDict):
    cv_text: str
    job_title: str
    job_description: str
    job_skills: str
    sanitized_cv: str
    llm_output: Optional[ScreeningLLMOutput]
    error: str


# ──── Node 1: Input Sanitization ────
def sanitize_input_node(state: EvaluationState) -> EvaluationState:
    raw_cv = state.get("cv_text") or ""
    # Truncate CV text to 4000 characters for optimal LLM context window
    sanitized = raw_cv[:4000].strip()
    return {**state, "sanitized_cv": sanitized, "error": ""}


# ──── Node 2: Structured LLM Engine ────
def invoke_llm_node(state: EvaluationState) -> EvaluationState:
    cv_text = state["sanitized_cv"]
    job_title = state.get("job_title", "Position")
    job_description = state.get("job_description", "")
    job_skills = state.get("job_skills", "")

    user_prompt = build_screening_user_prompt(
        job_title=job_title,
        job_description=job_description,
        job_skills=job_skills,
        cv_text=cv_text
    )

    messages = [
        SystemMessage(content=SCREENING_SYSTEM_PROMPT),
        HumanMessage(content=user_prompt)
    ]

    llm = get_llm(temperature=0.1, max_tokens=2500)

    try:
        # Attempt primary structured output invocation via Groq tool calling
        structured_llm = llm.with_structured_output(ScreeningLLMOutput)
        raw_res = structured_llm.invoke(messages)
        assert isinstance(raw_res, ScreeningLLMOutput)  # satisfies Pylance AND guards against off-spec responses
        result = raw_res
        return {**state, "llm_output": result, "error": ""}
    except Exception as primary_err:
        # Fallback: Invoke standard LLM with Pydantic JSON Output Parser
        try:
            parser = JsonOutputParser(pydantic_object=ScreeningLLMOutput)
            fallback_user_prompt = f"{user_prompt}\n\nReturn JSON strictly matching schema:\n{parser.get_format_instructions()}"
            fallback_messages = [
                SystemMessage(content=SCREENING_SYSTEM_PROMPT),
                HumanMessage(content=fallback_user_prompt)
            ]
            raw_response = llm.invoke(fallback_messages)
            parsed_dict = parser.parse(raw_response.content)
            result = ScreeningLLMOutput(**parsed_dict)
            return {**state, "llm_output": result, "error": ""}
        except Exception as fallback_err:
            return {
                **state,
                "llm_output": None,
                "error": f"LLM evaluation failed: {primary_err} | Fallback failed: {fallback_err}"
            }


# ──── Node 3: Output Validation & Post-Processing ────
def validate_output_node(state: EvaluationState) -> EvaluationState:
    output = state.get("llm_output")
    if not output:
        # Create safe fallback output if LLM invocation completely failed
        empty_block = EvidenceBlock(matched=[], missing=["CV evaluation unavailable"])
        fallback_output = ScreeningLLMOutput(
            skills_match=0,
            experience_match=0,
            education_match=0,
            keyword_coverage=0,
            confidence=0,
            evidence=EvidenceSet(
                skills_match=empty_block,
                experience_match=empty_block,
                education_match=empty_block,
                keyword_coverage=empty_block
            ),
            fit_flags=[],
            data_quality_flag=state.get("error") or "Evaluation pipeline failed"
        )
        return {**state, "llm_output": fallback_output}

    # Clamp scores to 0-100 range
    skills = max(0, min(100, output.skills_match))
    experience = max(0, min(100, output.experience_match))
    education = max(0, min(100, output.education_match))
    keywords = max(0, min(100, output.keyword_coverage))
    confidence = max(0, min(100, output.confidence))

    validated_output = ScreeningLLMOutput(
        skills_match=skills,
        experience_match=experience,
        education_match=education,
        keyword_coverage=keywords,
        confidence=confidence,
        evidence=output.evidence,
        fit_flags=getattr(output, "fit_flags", []) or [],
        data_quality_flag=output.data_quality_flag
    )

    return {**state, "llm_output": validated_output}


# ──── Build LangGraph State Pipeline ────
def _build_evaluation_graph():
    workflow = StateGraph(EvaluationState)

    workflow.add_node("sanitize_input", sanitize_input_node)
    workflow.add_node("invoke_llm", invoke_llm_node)
    workflow.add_node("validate_output", validate_output_node)

    workflow.set_entry_point("sanitize_input")
    workflow.add_edge("sanitize_input", "invoke_llm")
    workflow.add_edge("invoke_llm", "validate_output")
    workflow.add_edge("validate_output", END)

    return workflow.compile()


_evaluation_pipeline = _build_evaluation_graph()


def evaluate_cv_structured(
    cv_text: str,
    job_title: str,
    job_description: str,
    job_skills: str
) -> ScreeningLLMOutput:
    """Public entry point: Evaluates candidate CV text against job requirements using pure LLM pipeline."""
    initial_state: EvaluationState = {
        "cv_text": cv_text,
        "job_title": job_title,
        "job_description": job_description,
        "job_skills": job_skills,
        "sanitized_cv": "",
        "llm_output": None,
        "error": ""
    }

    final_state = _evaluation_pipeline.invoke(initial_state)
    return final_state["llm_output"]
