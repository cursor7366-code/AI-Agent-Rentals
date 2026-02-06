#!/usr/bin/env python3
"""
24JDC Court Calendar PDF Pipeline v3
=====================================

Target: http://24jdc.us/s/1-January-Calendar.pdf
Court:  24th Judicial District Court, Jefferson Parish, Louisiana

PIPELINE STAGES:
----------------
1. FETCH   - Download PDF from source URL to temp file
2. OCR     - Extract text via pdftotext; if insufficient, use pytesseract
3. EXTRACT - Parse structured hearing records from raw text
4. OUTPUT  - Emit JSON array of hearing records

COMPLETENESS SCORING:
---------------------
- completeness_score is calculated PER RECORD based on field completeness
- Score = (non-null extracted fields) / (total extractable fields)
- Fields counted: case_id, hearing_date, hearing_time, party_plaintiff, 
                  party_defendant, case_type, calendar_section
- Score range: 0.0 (nothing extracted) to 1.0 (all fields populated)
- ocr_confidence is always NULL (no OCR engine confidence is measured)

FAILURE CONDITIONS (STOP AND REPORT):
-------------------------------------
1. HTTP fetch fails (non-200 status or connection error)
2. PDF file is 0 bytes or corrupted (cannot be read)
3. pdftotext returns empty AND pytesseract returns empty
4. Extracted text < 100 characters (indicates failed extraction)
5. Zero hearing records parsed from text

When any failure occurs, script prints FAILURE JSON and exits non-zero.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime
from typing import Optional

# =============================================================================
# CONSTANTS (hardcoded for this single PDF source)
# =============================================================================

PDF_URL = "http://24jdc.us/s/1-January-Calendar.pdf"
COURT_NAME = "24th Judicial District Court"
JURISDICTION = "Jefferson Parish, Louisiana"

MIN_TEXT_LENGTH = 100  # Minimum chars to consider extraction successful


# =============================================================================
# STAGE 1: FETCH
# =============================================================================

def fetch_pdf(url: str) -> str:
    """
    Download PDF to a temp file. Returns path to temp file.
    FAILS if: HTTP error, connection error, or 0-byte response.
    """
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status != 200:
                fail(f"HTTP {response.status} fetching PDF")
            
            pdf_bytes = response.read()
            
            if len(pdf_bytes) == 0:
                fail("PDF fetch returned 0 bytes")
            
            # Write to temp file
            fd, path = tempfile.mkstemp(suffix=".pdf")
            with os.fdopen(fd, "wb") as f:
                f.write(pdf_bytes)
            
            return path
    
    except urllib.error.URLError as e:
        fail(f"Connection error: {e}")
    except Exception as e:
        fail(f"Fetch error: {e}")


# =============================================================================
# STAGE 2: OCR (Text Extraction)
# =============================================================================

def extract_text_pdftotext(pdf_path: str) -> str:
    """
    Extract text using pdftotext (poppler-utils).
    Returns extracted text or empty string on failure.
    """
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", pdf_path, "-"],
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.stdout.strip()
    except Exception:
        return ""


def extract_text_pytesseract(pdf_path: str) -> str:
    """
    Extract text using pytesseract OCR (for scanned PDFs).
    Converts PDF pages to images, then OCRs each.
    Returns extracted text or empty string on failure.
    """
    try:
        from pdf2image import convert_from_path
        import pytesseract
        
        images = convert_from_path(pdf_path, dpi=300)
        text_parts = []
        
        for img in images:
            page_text = pytesseract.image_to_string(img)
            text_parts.append(page_text)
        
        return "\n".join(text_parts).strip()
    except Exception:
        return ""


def extract_text(pdf_path: str) -> str:
    """
    Try pdftotext first. If result is too short, try pytesseract.
    FAILS if both methods return insufficient text.
    """
    # Try pdftotext first (faster, works for text-based PDFs)
    text = extract_text_pdftotext(pdf_path)
    
    if len(text) >= MIN_TEXT_LENGTH:
        return text
    
    # Fallback to OCR
    text = extract_text_pytesseract(pdf_path)
    
    if len(text) >= MIN_TEXT_LENGTH:
        return text
    
    # Both failed
    fail(f"Text extraction failed. pdftotext and pytesseract both returned <{MIN_TEXT_LENGTH} chars")


# =============================================================================
# STAGE 3: EXTRACT (Parse Structured Records)
# =============================================================================

def parse_hearing_records(raw_text: str) -> list[dict]:
    """
    Parse raw text into structured hearing records.
    
    Expected patterns in 24JDC calendars:
    - Case numbers like: 123-456, 12-3456, 2024-12345
    - Dates like: January 15, 2025 or 01/15/2025 or 1/15/25
    - Times like: 9:00 AM, 10:30 A.M., 2:00 PM
    - Party names: SMITH VS JONES, DOE V. STATE
    - Sections/Divisions: Division A, Section 1, DIV. B
    """
    records = []
    
    # Split into logical blocks (by case number pattern or double newlines)
    # Case number pattern: digits-digits format common in Louisiana courts
    case_pattern = r'\b(\d{2,4}[-]\d{3,6})\b'
    
    # Find all case numbers and their positions
    case_matches = list(re.finditer(case_pattern, raw_text))
    
    if not case_matches:
        # Try alternate pattern: just look for docket-style entries
        # Fall back to line-by-line parsing
        return parse_line_by_line(raw_text)
    
    # Extract blocks around each case number
    for i, match in enumerate(case_matches):
        start = match.start()
        end = case_matches[i + 1].start() if i + 1 < len(case_matches) else len(raw_text)
        
        block = raw_text[start:end]
        case_id = match.group(1)
        
        record = extract_fields_from_block(block, case_id)
        if record:
            records.append(record)
    
    return records


def parse_line_by_line(raw_text: str) -> list[dict]:
    """
    Fallback parser: treat each substantial line as potential record.
    """
    records = []
    lines = raw_text.split("\n")
    
    current_date = None
    current_time = None
    current_section = None
    
    for line in lines:
        line = line.strip()
        if len(line) < 5:
            continue
        
        # Check for date headers
        date_match = re.search(
            r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
            line, re.IGNORECASE
        )
        if date_match:
            current_date = parse_date(date_match.group(0))
            continue
        
        # Check for time headers
        time_match = re.search(r'(\d{1,2}:\d{2}\s*[AaPp]\.?[Mm]\.?)', line)
        if time_match and len(line) < 20:  # Likely a time header, not inline
            current_time = time_match.group(1)
            continue
        
        # Check for section/division headers
        section_match = re.search(r'(Division|Section|DIV\.?|SEC\.?)\s*([A-Z0-9]+)', line, re.IGNORECASE)
        if section_match and len(line) < 30:
            current_section = f"{section_match.group(1)} {section_match.group(2)}"
            continue
        
        # Check if line contains a case
        case_match = re.search(r'\b(\d{2,4}[-]\d{3,6})\b', line)
        if case_match:
            record = extract_fields_from_block(line, case_match.group(1))
            if record:
                # Apply context from headers
                if record["hearing_date"] is None and current_date:
                    record["hearing_date"] = current_date
                if record["hearing_time"] is None and current_time:
                    record["hearing_time"] = current_time
                if record["calendar_section"] is None and current_section:
                    record["calendar_section"] = current_section
                
                record["completeness_score"] = calculate_completeness(record)
                records.append(record)
    
    return records


def extract_fields_from_block(block: str, case_id: str) -> Optional[dict]:
    """
    Extract all fields from a text block containing one case.
    """
    record = {
        "case_id": case_id,
        "court_name": COURT_NAME,
        "jurisdiction": JURISDICTION,
        "hearing_date": None,
        "hearing_time": None,
        "party_plaintiff": None,
        "party_defendant": None,
        "case_type": None,
        "calendar_section": None,
        "source_url": PDF_URL,
        "raw_text_excerpt": block[:500].strip(),  # First 500 chars
        "completeness_score": 0.0,
        "ocr_confidence": None  # Not measured; no OCR engine confidence available
    }
    
    # Extract date
    date_patterns = [
        r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
        r'(\d{1,2}/\d{1,2}/\d{2,4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, block, re.IGNORECASE)
        if match:
            record["hearing_date"] = parse_date(match.group(0))
            break
    
    # Extract time
    time_match = re.search(r'(\d{1,2}:\d{2}\s*[AaPp]\.?[Mm]\.?)', block)
    if time_match:
        record["hearing_time"] = time_match.group(1).upper().replace(".", "")
    
    # Extract parties (VS / V. / VERSUS pattern)
    party_match = re.search(
        r'([A-Z][A-Z\s,\.\']+?)\s+(?:VS\.?|V\.?|VERSUS)\s+([A-Z][A-Z\s,\.\']+?)(?:\s|$|,|\d)',
        block.upper()
    )
    if party_match:
        record["party_plaintiff"] = party_match.group(1).strip().title()
        record["party_defendant"] = party_match.group(2).strip().title()
    
    # Extract case type (common Louisiana case types)
    case_types = [
        "CIVIL", "CRIMINAL", "FAMILY", "JUVENILE", "PROBATE", 
        "SUCCESSION", "DOMESTIC", "CUSTODY", "DIVORCE", "ADOPTION",
        "FELONY", "MISDEMEANOR", "TRAFFIC", "DWI", "PROTECTIVE ORDER"
    ]
    for ct in case_types:
        if ct in block.upper():
            record["case_type"] = ct.title()
            break
    
    # Extract section/division
    section_match = re.search(
        r'(?:Division|Section|DIV\.?|SEC\.?|DEPT\.?)\s*([A-Z0-9]+)',
        block, re.IGNORECASE
    )
    if section_match:
        record["calendar_section"] = section_match.group(1).upper()
    
    # Calculate completeness
    record["completeness_score"] = calculate_completeness(record)
    
    return record


def parse_date(date_str: str) -> Optional[str]:
    """
    Parse various date formats into ISO format (YYYY-MM-DD).
    """
    formats = [
        "%B %d, %Y",   # January 15, 2025
        "%B %d %Y",    # January 15 2025
        "%m/%d/%Y",    # 01/15/2025
        "%m/%d/%y",    # 01/15/25
    ]
    
    date_str = date_str.strip().replace(",", ", ").replace("  ", " ")
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    return None


def calculate_completeness(record: dict) -> float:
    """
    Calculate completeness score based on field population.
    
    Fields evaluated (7 total):
    - case_id, hearing_date, hearing_time, party_plaintiff,
      party_defendant, case_type, calendar_section
    
    Score = populated_fields / 7
    
    NOTE: This is NOT OCR confidence. No OCR engine confidence is measured.
    """
    fields = [
        "case_id", "hearing_date", "hearing_time", 
        "party_plaintiff", "party_defendant", 
        "case_type", "calendar_section"
    ]
    
    populated = sum(1 for f in fields if record.get(f) is not None)
    return round(populated / len(fields), 2)


# =============================================================================
# STAGE 4: OUTPUT
# =============================================================================

def output_results(records: list[dict]):
    """
    Print records as JSON array to stdout.
    """
    print(json.dumps(records, indent=2))


# =============================================================================
# FAILURE HANDLING
# =============================================================================

def fail(reason: str):
    """
    Print failure JSON and exit with non-zero status.
    """
    failure = {
        "status": "FAILURE",
        "reason": reason,
        "source_url": PDF_URL,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    print(json.dumps(failure, indent=2), file=sys.stderr)
    sys.exit(1)


# =============================================================================
# MAIN PIPELINE
# =============================================================================

def main():
    """
    Execute pipeline: Fetch → OCR → Extract → Output
    """
    # Stage 1: Fetch
    pdf_path = fetch_pdf(PDF_URL)
    
    try:
        # Stage 2: OCR / Text Extraction
        raw_text = extract_text(pdf_path)
        
        # Stage 3: Extract Records
        records = parse_hearing_records(raw_text)
        
        if len(records) == 0:
            fail("Zero hearing records parsed from extracted text")
        
        # Stage 4: Output
        output_results(records)
        
    finally:
        # Cleanup temp file
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


if __name__ == "__main__":
    main()
