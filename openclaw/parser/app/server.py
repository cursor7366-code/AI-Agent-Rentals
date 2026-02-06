"""
OpenClaw Doc Parser Server
Sandboxed extraction - NO INTERNET EGRESS

Contract: opint.parse.v1
Input: POST /parse {"artifact_path": "/data/archive/<...>"}
Output: JSON matching opint.parse.v1 schema
"""

import hashlib
import json
import os
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
import pytesseract
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel

app = FastAPI(title="OpenClaw Doc Parser", version="1.0.0")

# Contract version
CONTRACT_VERSION = "opint.parse.v1"

# Base path for archived artifacts (mounted read-only)
ARCHIVE_BASE = Path("/data/archive")


class ParseRequest(BaseModel):
    artifact_path: str


class OCRConfidenceSummary(BaseModel):
    min_confidence: float
    max_confidence: float
    mean_confidence: float
    pages_with_ocr: int


class ParseResponse(BaseModel):
    contract: str = CONTRACT_VERSION
    content_type: str
    text: str
    pages: Optional[list[str]] = None
    ocr: Optional[dict] = None
    warnings: list[str] = []
    errors: list[str] = []


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "contract": CONTRACT_VERSION}


@app.post("/parse")
async def parse_artifact(request: ParseRequest) -> JSONResponse:
    """
    Parse an artifact and return extracted text.
    
    Validates path is under ARCHIVE_BASE (no path traversal).
    """
    warnings = []
    errors = []
    
    # Validate and resolve path
    try:
        artifact_path = Path(request.artifact_path)
        # Ensure path is under archive base (prevent traversal)
        resolved = artifact_path.resolve()
        if not str(resolved).startswith(str(ARCHIVE_BASE.resolve())):
            raise HTTPException(status_code=400, detail="Path traversal not allowed")
        
        if not resolved.exists():
            raise HTTPException(status_code=404, detail=f"Artifact not found: {request.artifact_path}")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid path: {e}")
    
    # Detect content type
    suffix = resolved.suffix.lower()
    content_type = detect_content_type(resolved, suffix)
    
    # Parse based on content type
    text = ""
    pages = None
    ocr_summary = None
    
    try:
        if content_type == "application/pdf":
            text, pages, ocr_summary, parse_warnings = parse_pdf(resolved)
            warnings.extend(parse_warnings)
        elif content_type == "text/html":
            text, parse_warnings = parse_html(resolved)
            warnings.extend(parse_warnings)
        elif content_type.startswith("image/"):
            text, ocr_summary, parse_warnings = parse_image(resolved)
            warnings.extend(parse_warnings)
        else:
            # Try as text
            try:
                text = resolved.read_text(encoding="utf-8", errors="replace")
                warnings.append(f"Unknown content type {content_type}, treated as text")
            except Exception as e:
                errors.append(f"Cannot read as text: {e}")
                
    except Exception as e:
        errors.append(f"Parse error: {e}")
    
    response = ParseResponse(
        contract=CONTRACT_VERSION,
        content_type=content_type,
        text=text,
        pages=pages,
        ocr={"performed": ocr_summary is not None, "confidence_summary": ocr_summary} if ocr_summary else None,
        warnings=warnings,
        errors=errors
    )
    
    return JSONResponse(content=response.model_dump())


def detect_content_type(path: Path, suffix: str) -> str:
    """Detect content type from file signature and extension"""
    # Read magic bytes
    with open(path, "rb") as f:
        header = f.read(16)
    
    # Check signatures
    if header.startswith(b"%PDF"):
        return "application/pdf"
    if header.startswith(b"<!DOCTYPE") or header.startswith(b"<html") or b"<html" in header[:100]:
        return "text/html"
    if header.startswith(b"\x89PNG"):
        return "image/png"
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if header.startswith(b"GIF8"):
        return "image/gif"
    
    # Fall back to extension
    ext_map = {
        ".pdf": "application/pdf",
        ".html": "text/html",
        ".htm": "text/html",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".txt": "text/plain",
    }
    return ext_map.get(suffix, "unknown")


def parse_pdf(path: Path) -> tuple[str, list[str], Optional[dict], list[str]]:
    """
    Parse PDF, extracting text per page.
    If a page has no text, run OCR.
    Returns: (full_text, pages, ocr_summary, warnings)
    """
    warnings = []
    pages = []
    ocr_confidences = []
    
    doc = fitz.open(path)
    
    for page_num, page in enumerate(doc):
        page_text = page.get_text().strip()
        
        if not page_text:
            # No extractable text - run OCR
            warnings.append(f"Page {page_num + 1}: no text, running OCR")
            try:
                pix = page.get_pixmap(dpi=300)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # Get OCR with confidence data
                ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                
                # Extract text and confidence
                page_text_parts = []
                page_confidences = []
                for i, conf in enumerate(ocr_data["conf"]):
                    if conf > 0:  # -1 means no confidence data
                        page_text_parts.append(ocr_data["text"][i])
                        page_confidences.append(conf / 100.0)
                
                page_text = " ".join(page_text_parts)
                if page_confidences:
                    ocr_confidences.extend(page_confidences)
                    
            except Exception as e:
                warnings.append(f"Page {page_num + 1}: OCR failed: {e}")
                page_text = ""
        
        pages.append(page_text)
    
    doc.close()
    
    full_text = "\n\n".join(pages)
    
    # Build OCR summary if we did any OCR
    ocr_summary = None
    if ocr_confidences:
        ocr_summary = {
            "min_confidence": min(ocr_confidences),
            "max_confidence": max(ocr_confidences),
            "mean_confidence": sum(ocr_confidences) / len(ocr_confidences),
            "pages_with_ocr": len([p for i, p in enumerate(pages) if i < len(ocr_confidences)])
        }
    
    return full_text, pages, ocr_summary, warnings


def parse_html(path: Path) -> tuple[str, list[str]]:
    """Parse HTML and extract text content"""
    warnings = []
    
    content = path.read_bytes()
    soup = BeautifulSoup(content, "lxml")
    
    # Remove script and style elements
    for element in soup(["script", "style", "nav", "header", "footer"]):
        element.decompose()
    
    text = soup.get_text(separator="\n", strip=True)
    
    return text, warnings


def parse_image(path: Path) -> tuple[str, Optional[dict], list[str]]:
    """Parse image with OCR"""
    warnings = []
    
    try:
        img = Image.open(path)
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        
        text_parts = []
        confidences = []
        for i, conf in enumerate(ocr_data["conf"]):
            if conf > 0:
                text_parts.append(ocr_data["text"][i])
                confidences.append(conf / 100.0)
        
        text = " ".join(text_parts)
        
        ocr_summary = None
        if confidences:
            ocr_summary = {
                "min_confidence": min(confidences),
                "max_confidence": max(confidences),
                "mean_confidence": sum(confidences) / len(confidences),
                "pages_with_ocr": 1
            }
        
        return text, ocr_summary, warnings
        
    except Exception as e:
        warnings.append(f"Image OCR failed: {e}")
        return "", None, warnings


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
