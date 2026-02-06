"""
OpenClaw v2 — HTML Source
Source: Louisiana 4th Circuit Court of Appeal Dockets
Domain: Civil Court Dockets (Appeals)

This source is HTML, not JSON. Requires parsing.
"""

import json
import os
import re
import urllib.request
from datetime import datetime, timezone

# Config
SOURCE_URL = "https://www.la4th.org/Schedule.aspx"
OUTPUT_DIR = "output"


def fetch():
    """Step 1: Download the HTML page"""
    print("Step 1: Fetch")
    
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "OpenClaw/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read().decode("utf-8")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(f"{OUTPUT_DIR}/raw.html", "w") as f:
        f.write(raw)
    
    print(f"  Fetched {len(raw)} bytes")
    return raw


def parse(html):
    """Step 2: Extract case blocks from HTML"""
    print("Step 2: Parse")
    
    # Find the docket section
    # Pattern: <h4>case_number</h4> followed by <p> tags until <hr>
    
    # Split by <hr> to get individual case blocks
    blocks = re.split(r'<hr\s*/?>', html)
    
    cases = []
    for block in blocks:
        # Look for case number pattern
        case_match = re.search(r'<h4>([^<]+)</h4>', block)
        if not case_match:
            continue
        
        case_number = case_match.group(1).strip()
        
        # Extract all <p> contents
        p_tags = re.findall(r'<p>(.+?)</p>', block, re.DOTALL)
        
        if not p_tags:
            continue
        
        # First <p> is parties (plaintiff vs defendant)
        parties_raw = re.sub(r'<[^>]+>', '', p_tags[0])  # Strip HTML tags
        parties_raw = ' '.join(parties_raw.split())  # Normalize whitespace
        
        # Parse plaintiff vs defendant
        plaintiff = None
        defendant = None
        if ' vs. ' in parties_raw.lower():
            parts = re.split(r'\s+vs\.?\s+', parties_raw, flags=re.IGNORECASE)
            if len(parts) >= 2:
                plaintiff = parts[0].strip()
                defendant = parts[1].strip()
        else:
            plaintiff = parties_raw
        
        # Extract hearing date
        hearing_date = None
        for p in p_tags:
            date_match = re.search(r'Hearing Date:\s*</strong>\s*(\d{2}/\d{2}/\d{4})', p)
            if date_match:
                hearing_date = date_match.group(1)
                break
        
        # Extract time session
        time_session = None
        for p in p_tags:
            time_match = re.search(r'Time Session:</strong>\s*(AM|PM)', p)
            if time_match:
                time_session = time_match.group(1)
                break
        
        cases.append({
            "case_number": case_number,
            "parties_raw": parties_raw,
            "plaintiff": plaintiff,
            "defendant": defendant,
            "hearing_date": hearing_date,
            "time_session": time_session,
        })
    
    print(f"  Parsed {len(cases)} cases")
    return cases


def extract(cases):
    """Step 3: Map to schema"""
    print("Step 3: Extract")
    
    records = []
    for c in cases:
        record = {
            "case_id": c["case_number"],
            "court_name": "Louisiana 4th Circuit Court of Appeal",
            "jurisdiction": "Orleans Parish / 4th Circuit",
            "filing_type": None,  # Not available
            "filing_date": None,  # Not available (only hearing date)
            "party_plaintiff": c["plaintiff"],
            "party_defendant": c["defendant"],
            "property_address": None,  # Not available
            "document_type": "Docket Entry",
            "document_url": None,
            "status": f"Hearing scheduled: {c['hearing_date']} {c['time_session'] or ''}".strip() if c['hearing_date'] else None,
            "raw_text_excerpt": c["parties_raw"][:200] if c["parties_raw"] else None,
            "source_url": SOURCE_URL,
            "confidence_score": None  # No OCR used
        }
        records.append(record)
    
    print(f"  Mapped {len(records)} records")
    return records


def output(records):
    """Step 4: Write records and log"""
    print("Step 4: Output")
    
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    
    records_path = f"{OUTPUT_DIR}/la4th_records_{timestamp}.json"
    with open(records_path, "w") as f:
        json.dump(records, f, indent=2)
    
    log = {
        "timestamp": timestamp,
        "source_url": SOURCE_URL,
        "records_count": len(records)
    }
    log_path = f"{OUTPUT_DIR}/la4th_log_{timestamp}.json"
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)
    
    print(f"  Wrote {len(records)} records to {records_path}")
    return records_path


def main():
    print("=== OpenClaw v2 (HTML) ===")
    print(f"Source: {SOURCE_URL}")
    print()
    
    html = fetch()
    cases = parse(html)
    records = extract(cases)
    output(records)
    
    print()
    print("Done.")


if __name__ == "__main__":
    main()
