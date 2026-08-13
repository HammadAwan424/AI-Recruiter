import fitz
from typing import Union


def extract_text_from_pdf(pdf_source: Union[str, bytes]) -> str:
    """
    Extracts plain text content from a PDF file path or raw PDF bytes using PyMuPDF (fitz).
    """
    if isinstance(pdf_source, str):
        doc = fitz.open(pdf_source)
    else:
        doc = fitz.open(stream=pdf_source, filetype="pdf")

    extracted_text = ""
    for page in doc:
        text = page.get_text()
        if text:
            extracted_text += text

    return extracted_text
