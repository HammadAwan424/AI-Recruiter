import fitz
from pathlib import Path
from typing import Optional, Union

from app.schemas.extraction import ExtractedResumeText


def extract_text_from_pdf(
    pdf_source: Union[str, bytes],
    source_name: Optional[str] = None,
) -> ExtractedResumeText:
    """
    Extracts and validates resume text from a PDF file path or raw PDF bytes.
    """
    if isinstance(pdf_source, str):
        doc = fitz.open(pdf_source)
        resolved_source_name = source_name or Path(pdf_source).name
    else:
        doc = fitz.open(stream=pdf_source, filetype="pdf")
        resolved_source_name = source_name or "uploaded_resume.pdf"

    extracted_text = ""
    for page in doc:
        text = page.get_text()
        if text:
            extracted_text += text

    return ExtractedResumeText(
        schema_version="extraction.extracted_resume_text.v1",
        source_name=resolved_source_name,
        cv_text=extracted_text,
    )
