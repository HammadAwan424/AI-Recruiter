import os
from dotenv import load_dotenv
from app.utils.logger import get_logger
from app.utils.llm_factory import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

from app.schemas.extraction import ExtractedResumeText, ParsedResumeProfile
from app.schemas.parsing import ParsingLLMOutput
from app.agents.parsing.prompts import PARSING_SYSTEM_PROMPT
from app.utility.token_usage import log_token_usage

load_dotenv()
logger = get_logger(__name__, "parser.log")


MAX_PARSING_CV_CHARS = 16000


def parse_resume_structured(
    resume: ExtractedResumeText,
) -> ParsedResumeProfile:
    """
    Parse a validated extracted-resume schema into a structured profile.
    """
    validated_resume = ExtractedResumeText.model_validate(resume)
    sanitized_cv = validated_resume.cv_text.strip()[:MAX_PARSING_CV_CHARS]
    if not sanitized_cv:
        logger.warning("Empty or missing CV text provided for resume parsing.")
        return ParsedResumeProfile(
            schema_version="extraction.parsed_resume_profile.v1",
            source_name=validated_resume.source_name,
            profile=ParsingLLMOutput(
                skills=[],
                work_history=[],
                education=[],
                certifications=[],
                needs_review=True,
                review_reason="Empty or missing resume text",
            ),
        )

    logger.info("Starting structured resume parsing (CV length: %d chars)...", len(sanitized_cv))

    messages = [
        SystemMessage(content=PARSING_SYSTEM_PROMPT),
        HumanMessage(content=f"CANDIDATE RESUME / CV TEXT:\n{sanitized_cv}")
    ]

    llm = get_llm(temperature=0.1, max_tokens=4000)

    try:
        # Primary structured output invocation via Groq tool calling
        structured_llm = llm.with_structured_output(ParsingLLMOutput, include_raw=True)
        output = structured_llm.invoke(messages)
        raw_res = output["raw"]
        structured_res = output["parsed"]

        log_token_usage(logger, "Resume parsing (structured)", raw_res)
        logger.info(raw_res)
        logger.info(structured_res)

        if not isinstance(structured_res, ParsingLLMOutput):
            raise ValueError("Structured parser returned an invalid result")
        logger.info(
            "Primary structured parsing succeeded: %d skills, %d work entries, %d education entries extracted.",
            len(structured_res.skills),
            len(structured_res.work_history),
            len(structured_res.education),
        )
        return ParsedResumeProfile(
            schema_version="extraction.parsed_resume_profile.v1",
            source_name=validated_resume.source_name,
            profile=structured_res,
        )
    except Exception as primary_err:
        logger.warning("Primary structured LLM parsing failed: %s. Attempting fallback parser...", primary_err)
        try:
            # Fallback: Invoke standard LLM with Pydantic JSON Output Parser
            parser = JsonOutputParser(pydantic_object=ParsingLLMOutput)
            fallback_prompt = (
                f"CANDIDATE RESUME / CV TEXT:\n{sanitized_cv}\n\n"
                f"Return JSON strictly matching schema:\n{parser.get_format_instructions()}"
            )
            fallback_messages = [
                SystemMessage(content=PARSING_SYSTEM_PROMPT),
                HumanMessage(content=fallback_prompt)
            ]
            raw_response = llm.invoke(fallback_messages)
            log_token_usage(logger, "Resume parsing (fallback)", raw_response)
            parsed_dict = parser.parse(raw_response.content)
            result = ParsingLLMOutput(**parsed_dict)
            logger.info(
                "Fallback parsing succeeded: %d skills, %d work entries extracted.",
                len(result.skills),
                len(result.work_history),
            )
            return ParsedResumeProfile(
                schema_version="extraction.parsed_resume_profile.v1",
                source_name=validated_resume.source_name,
                profile=result,
            )
        except Exception as fallback_err:
            logger.error(
                "Both primary and fallback resume parsing failed. Primary error: %s | Fallback error: %s",
                primary_err,
                fallback_err,
            )
            return ParsedResumeProfile(
                schema_version="extraction.parsed_resume_profile.v1",
                source_name=validated_resume.source_name,
                profile=ParsingLLMOutput(
                    skills=[],
                    work_history=[],
                    education=[],
                    certifications=[],
                    needs_review=True,
                    review_reason=f"LLM parsing failed: {primary_err} | Fallback failed: {fallback_err}",
                ),
            )
