#!/usr/bin/env python3
"""
OpenClaw v5 — Orleans Parish Code Enforcement
==============================================

Sources (data.nola.gov):
1. Code Enforcement Inspections: uh5a-f7uw (field: location)
2. Adjudication Enforcement Cases: wy29-i338 (field: address)

ANTI-HALLUCINATION SAFEGUARDS:
- Real HTTP requests to actual API endpoints
- Response validation (must be valid JSON array with records)
- Field extraction only from fields that exist
- Raw data excerpt included for verification
- Source URL + timestamp logged
- Fails loudly on any error
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

# =============================================================================
# CONFIGURATION
# =============================================================================

DATASETS = {
    "inspections": {
        "name": "Code Enforcement Inspections",
        "url": "https://data.nola.gov/resource/uh5a-f7uw.json",
        "limit": 5000,
        "address_field": "location",
        "case_field": "caseno",
        "date_field": "inspectiondate",
        "type_field": "inspectiontype",
        "desc_field": "inspectionresult"
    },
    "adjudication": {
        "name": "Adjudication Enforcement Cases",
        "url": "https://data.nola.gov/resource/wy29-i338.json",
        "limit": 5000,
        "address_field": "address",
        "case_field": "numstring",
        "date_field": "d_filed",
        "type_field": "type",
        "desc_field": "currentstatus",
        "lat_field": "latitude",
        "lng_field": "longitude"
    }
}

OUTPUT_DIR = "/tmp/openclaw_output"
JURISDICTION = "Orleans Parish, Louisiana"

# =============================================================================
# FETCH
# =============================================================================

def fetch_dataset(key: str) -> tuple[list, str]:
    """
    Fetch data from NOLA Open Data API.
    Returns (records, raw_sample) for verification.
    """
    config = DATASETS[key]
    url = f"{config['url']}?$limit={config['limit']}"
    
    print(f"  Fetching: {config['name']}")
    print(f"  URL: {url}")
    
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "OpenClaw/5.0",
            "Accept": "application/json"
        })
        
        with urllib.request.urlopen(req, timeout=60) as response:
            if response.status != 200:
                fail(f"HTTP {response.status} from {url}")
            
            raw_text = response.read().decode("utf-8")
            
            if len(raw_text) < 10:
                fail(f"Empty response from {url}")
            
            data = json.loads(raw_text)
            
            if not isinstance(data, list):
                fail(f"Expected array from {url}, got {type(data)}")
            
            if len(data) == 0:
                print(f"  WARNING: Dataset returned 0 records")
                return [], ""
            
            print(f"  Received: {len(data)} records")
            return data, json.dumps(data[0])  # Sample for verification
            
    except urllib.error.URLError as e:
        fail(f"Connection error: {e}")


# =============================================================================
# EXTRACT
# =============================================================================

def extract_records(records: list, key: str) -> list:
    """
    Extract standardized fields from records.
    Uses dataset-specific field mappings.
    """
    config = DATASETS[key]
    extracted = []
    
    for r in records:
        address = r.get(config["address_field"])
        
        # Skip records without address
        if not address:
            continue
        
        record = {
            "dataset": config["name"],
            "jurisdiction": JURISDICTION,
            "source_url": config["url"],
            
            # Core fields
            "case_id": r.get(config.get("case_field")),
            "address": address,
            "violation_type": r.get(config.get("type_field")),
            "description": r.get(config.get("desc_field")),
            "date": r.get(config.get("date_field")),
            
            # Coordinates if available
            "latitude": r.get(config.get("lat_field")),
            "longitude": r.get(config.get("lng_field")),
            
            # Raw excerpt for verification
            "raw_excerpt": json.dumps(r)[:300],
            
            # Metadata
            "extracted_at": datetime.now(timezone.utc).isoformat()
        }
        
        extracted.append(record)
    
    return extracted


# =============================================================================
# OUTPUT
# =============================================================================

def write_output(records: list, metadata: dict) -> str:
    """Write records to JSON file."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    
    # Records file
    records_path = f"{OUTPUT_DIR}/orleans_distress_{timestamp}.json"
    with open(records_path, "w") as f:
        json.dump(records, f, indent=2)
    
    # Metadata file
    metadata["output_file"] = records_path
    metadata["timestamp"] = timestamp
    metadata["total_records"] = len(records)
    
    log_path = f"{OUTPUT_DIR}/orleans_distress_{timestamp}_log.json"
    with open(log_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n  Records: {records_path}")
    print(f"  Log: {log_path}")
    
    return records_path


# =============================================================================
# FAILURE
# =============================================================================

def fail(reason: str):
    """Fail loudly, never continue with bad data."""
    print(f"\n!!! FAILURE: {reason}", file=sys.stderr)
    sys.exit(1)


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 60)
    print("OpenClaw v5 — Orleans Parish Distress Signals")
    print("=" * 60)
    
    all_records = []
    metadata = {"jurisdiction": JURISDICTION, "datasets": []}
    
    for key in DATASETS:
        print(f"\n[{key}]")
        records, sample = fetch_dataset(key)
        
        if records:
            extracted = extract_records(records, key)
            all_records.extend(extracted)
            
            metadata["datasets"].append({
                "key": key,
                "name": DATASETS[key]["name"],
                "raw_count": len(records),
                "extracted_count": len(extracted),
                "sample_record": sample[:200]
            })
            
            print(f"  Extracted: {len(extracted)} records with addresses")
    
    # Validation
    print("\n" + "-" * 60)
    print("VALIDATION")
    print("-" * 60)
    
    if len(all_records) == 0:
        fail("Zero records extracted")
    
    unique_addresses = len(set(r["address"] for r in all_records))
    print(f"  Total records: {len(all_records)}")
    print(f"  Unique addresses: {unique_addresses}")
    
    # Output
    print("\n" + "-" * 60)
    print("OUTPUT")
    print("-" * 60)
    
    output_path = write_output(all_records, metadata)
    
    # Show samples for verification
    print("\n" + "-" * 60)
    print("SAMPLE RECORDS (verify these are real)")
    print("-" * 60)
    
    for i, r in enumerate(all_records[:3]):
        print(f"\nRecord {i+1}:")
        print(f"  Address: {r['address']}")
        print(f"  Case ID: {r['case_id']}")
        print(f"  Type: {r['violation_type']}")
        print(f"  Date: {r['date']}")
    
    print("\n" + "=" * 60)
    print(f"COMPLETE — {len(all_records)} distress signals extracted")
    print("=" * 60)
    
    return output_path


if __name__ == "__main__":
    main()
