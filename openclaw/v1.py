"""
OpenClaw v1 — Minimum Viable Pipeline
Source: NOLA Open Data Code Enforcement (structured JSON)
Domain: Code Violations
"""

import json
import os
import urllib.request
from datetime import datetime, timezone

# Config
SOURCE_URL = "https://data.nola.gov/resource/uh5a-f7uw.json?$limit=100"
OUTPUT_DIR = "output"


def fetch():
    """Step 1: Download the data"""
    print("Step 1: Fetch")
    
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "OpenClaw/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read().decode("utf-8")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(f"{OUTPUT_DIR}/raw.json", "w") as f:
        f.write(raw)
    
    print(f"  Fetched {len(raw)} bytes")
    return raw


def parse(raw_text):
    """Step 2: Parse JSON"""
    print("Step 2: Parse")
    data = json.loads(raw_text)
    print(f"  Parsed {len(data)} records")
    return data


def extract(data):
    """Step 3: Map source fields to schema"""
    print("Step 3: Extract (field mapping)")
    
    records = []
    for r in data:
        record = {
            "case_number": r.get("caseno"),
            "property_address": r.get("location"),
            "violation_type": r.get("inspectiontype"),
            "violation_description": r.get("inspectionresult"),
            "issue_date": r.get("inspectiondate"),
            "status": None,  # Not in source
            "source_url": SOURCE_URL
        }
        records.append(record)
    
    print(f"  Mapped {len(records)} records")
    return records


def output(records):
    """Step 4: Write records and log"""
    print("Step 4: Output")
    
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    
    records_path = f"{OUTPUT_DIR}/records_{timestamp}.json"
    with open(records_path, "w") as f:
        json.dump(records, f, indent=2)
    
    log = {
        "timestamp": timestamp,
        "source_url": SOURCE_URL,
        "records_count": len(records)
    }
    log_path = f"{OUTPUT_DIR}/log_{timestamp}.json"
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)
    
    print(f"  Wrote {len(records)} records to {records_path}")
    return records_path


def main():
    print("=== OpenClaw v1 ===")
    print(f"Source: {SOURCE_URL}")
    print()
    
    raw = fetch()
    data = parse(raw)
    records = extract(data)
    output(records)
    
    print()
    print("Done.")


if __name__ == "__main__":
    main()
