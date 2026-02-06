#!/usr/bin/env python3
"""
JPSO Sheriff Sales Pipeline v4
==============================

Target: https://eservices2.jpso.com/JudpSale/Home/RealEstate
Jurisdiction: Jefferson Parish, Louisiana
Data type: Sheriff / Civil Sales (foreclosure auctions)

PIPELINE STAGES:
----------------
1. FETCH   - Download HTML from source URL
2. PARSE   - Extract table rows from HTML
3. EXTRACT - Parse structured sale records from rows
4. OUTPUT  - Emit JSON array to file

COMPLETENESS SCORING:
---------------------
- completeness_score is calculated PER RECORD based on field completeness
- Score = (non-null/non-empty key fields) / (total key fields)
- Key fields: case_id, sale_date, address (non-"Address Not Available"), 
              writ_amount, party_plaintiff, party_defendant
- Score range: 0.0 to 1.0
- This is NOT OCR confidence

FAILURE CONDITIONS (STOP AND REPORT):
-------------------------------------
1. HTTP fetch fails (non-200 status or connection error)
2. HTML contains no property rows
3. Zero records parsed from table

Usage:
    python3 jpso_pipeline_v4.py --out output.json
    python3 jpso_pipeline_v4.py --sale-date 2025-02-05 --out output.json
"""

import argparse
import json
import re
import sys
import urllib.request
import urllib.parse
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional

# =============================================================================
# CONSTANTS
# =============================================================================

BASE_URL = "https://eservices2.jpso.com/JudpSale/Home/RealEstate"
POST_URL = "https://eservices2.jpso.com/JudpSale/Home/DateSelectorPartial"
SOURCE_URL = "https://eservices2.jpso.com/JudpSale/Home/RealEstate"

# =============================================================================
# STAGE 1: FETCH
# =============================================================================

def fetch_html(sale_date: Optional[str] = None) -> str:
    """
    Fetch HTML from JPSO judicial sales page.
    If sale_date provided (YYYY-MM-DD), POST to filter by that date.
    Otherwise, GET the default page.
    
    FAILS if: HTTP error, connection error, or empty response.
    """
    headers = {"User-Agent": "Mozilla/5.0"}
    
    try:
        if sale_date:
            # Convert YYYY-MM-DD to M/D/YYYY for POST
            dt = datetime.strptime(sale_date, "%Y-%m-%d")
            date_str = f"{dt.month}/{dt.day}/{dt.year}"
            
            data = urllib.parse.urlencode({
                "Type": "RE",
                "SaleDateString": date_str
            }).encode("utf-8")
            
            req = urllib.request.Request(POST_URL, data=data, headers=headers)
        else:
            req = urllib.request.Request(BASE_URL, headers=headers)
        
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status != 200:
                fail(f"HTTP {response.status} fetching page")
            
            html = response.read().decode("utf-8")
            
            if len(html) < 100:
                fail("HTML response too short")
            
            return html
    
    except urllib.error.URLError as e:
        fail(f"Connection error: {e}")
    except Exception as e:
        fail(f"Fetch error: {e}")


# =============================================================================
# STAGE 2: PARSE
# =============================================================================

def parse_rows(html: str) -> list[dict]:
    """
    Extract property rows from HTML table.
    Returns list of raw row data.
    
    FAILS if: No property rows found.
    """
    # Find all property rows
    row_pattern = r'<tr class="property-row-re"[^>]*>(.*?)</tr>'
    rows = re.findall(row_pattern, html, re.DOTALL)
    
    if not rows:
        fail("No property rows found in HTML")
    
    parsed_rows = []
    for row_html in rows:
        # Extract cells
        cell_pattern = r'<td[^>]*>(.*?)</td>'
        cells = re.findall(cell_pattern, row_html, re.DOTALL)
        
        if len(cells) >= 5:
            parsed_rows.append({
                "case_num": clean_text(cells[0]),
                "case_style": clean_text(cells[1]),
                "sale_date": clean_text(cells[2]),
                "address": clean_text(cells[3]),
                "writ_amount": clean_text(cells[4]),
                "raw_html": row_html[:500]
            })
    
    return parsed_rows


def clean_text(text: str) -> str:
    """Clean HTML text: remove tags, normalize whitespace."""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&#39;', "'")
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# =============================================================================
# STAGE 3: EXTRACT
# =============================================================================

def extract_records(rows: list[dict]) -> list[dict]:
    """
    Convert parsed rows into structured records.
    """
    records = []
    
    for row in rows:
        record = extract_single_record(row)
        if record:
            records.append(record)
    
    if not records:
        fail("Zero records extracted from parsed rows")
    
    return records


def extract_single_record(row: dict) -> dict:
    """
    Extract structured fields from a single row.
    """
    # Parse case_id
    case_id = row["case_num"] if row["case_num"] else None
    
    # Parse sale_date to ISO format
    sale_date = parse_date(row["sale_date"])
    
    # Parse address
    address = row["address"] if row["address"] else "Address Not Available"
    if not address or address.lower() in ["", "n/a"]:
        address = "Address Not Available"
    
    # Parse writ_amount - normalize to decimal string
    writ_amount = parse_writ_amount(row["writ_amount"])
    
    # Parse parties from case_style
    case_style = row["case_style"]
    plaintiff, defendant = parse_parties(case_style)
    
    # Build record
    record = {
        "case_id": case_id,
        "sale_date": sale_date,
        "address": address,
        "writ_amount": writ_amount,
        "case_style": case_style,
        "party_plaintiff": plaintiff,
        "party_defendant": defendant,
        "source_url": SOURCE_URL,
        "raw_row_text_excerpt": row["raw_html"][:300] if row.get("raw_html") else "",
        "completeness_score": 0.0
    }
    
    # Calculate completeness
    record["completeness_score"] = calculate_completeness(record)
    
    return record


def parse_date(date_str: str) -> Optional[str]:
    """
    Parse date string to ISO format (YYYY-MM-DD).
    Expected input: M/D/YYYY or MM/DD/YYYY
    """
    if not date_str:
        return None
    
    formats = [
        "%m/%d/%Y",
        "%m/%d/%y",
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    return None


def parse_writ_amount(amount_str: str) -> Optional[str]:
    """
    Parse writ amount to normalized decimal string.
    Input: "$103,821.16" or "103821.16"
    Output: "103821.16"
    """
    if not amount_str:
        return None
    
    # Remove $ and commas
    cleaned = amount_str.replace("$", "").replace(",", "").strip()
    
    try:
        # Validate it's a valid decimal
        d = Decimal(cleaned)
        # Return as string with 2 decimal places
        return str(d.quantize(Decimal("0.01")))
    except InvalidOperation:
        return None


def parse_parties(case_style: str) -> tuple[Optional[str], Optional[str]]:
    """
    Split case_style on VERSUS / VS to extract plaintiff and defendant.
    Returns (plaintiff, defendant) tuple.
    """
    if not case_style:
        return (None, None)
    
    # Try splitting on various patterns
    patterns = [
        r'\s+VERSUS\s+',
        r'\s+VS\.?\s+',
        r'\s+V\.?\s+',
    ]
    
    for pattern in patterns:
        match = re.split(pattern, case_style, maxsplit=1, flags=re.IGNORECASE)
        if len(match) == 2:
            plaintiff = match[0].strip()
            defendant = match[1].strip()
            return (plaintiff if plaintiff else None, defendant if defendant else None)
    
    return (None, None)


def calculate_completeness(record: dict) -> float:
    """
    Calculate completeness score based on key field presence.
    
    Key fields (6 total):
    - case_id
    - sale_date
    - address (not "Address Not Available")
    - writ_amount
    - party_plaintiff
    - party_defendant
    
    Score = populated_fields / 6
    """
    score = 0
    total = 6
    
    if record.get("case_id"):
        score += 1
    if record.get("sale_date"):
        score += 1
    if record.get("address") and record["address"] != "Address Not Available":
        score += 1
    if record.get("writ_amount"):
        score += 1
    if record.get("party_plaintiff"):
        score += 1
    if record.get("party_defendant"):
        score += 1
    
    return round(score / total, 2)


# =============================================================================
# STAGE 4: OUTPUT
# =============================================================================

def write_output(records: list[dict], output_path: str):
    """
    Write records as JSON array to output file.
    """
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    
    print(f"Wrote {len(records)} records to {output_path}", file=sys.stderr)


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
        "source_url": SOURCE_URL,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    print(json.dumps(failure, indent=2), file=sys.stderr)
    sys.exit(1)


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="JPSO Sheriff Sales Pipeline v4")
    parser.add_argument("--sale-date", type=str, help="Filter by sale date (YYYY-MM-DD)")
    parser.add_argument("--out", type=str, required=True, help="Output JSON file path")
    
    args = parser.parse_args()
    
    # Validate date format if provided
    if args.sale_date:
        try:
            datetime.strptime(args.sale_date, "%Y-%m-%d")
        except ValueError:
            fail(f"Invalid date format: {args.sale_date}. Use YYYY-MM-DD")
    
    # Stage 1: Fetch
    html = fetch_html(args.sale_date)
    
    # Stage 2: Parse
    rows = parse_rows(html)
    
    # Stage 3: Extract
    records = extract_records(rows)
    
    # Stage 4: Output
    write_output(records, args.out)


if __name__ == "__main__":
    main()
