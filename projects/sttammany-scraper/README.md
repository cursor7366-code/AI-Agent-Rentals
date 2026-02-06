# St. Tammany Parish Code Enforcement Scraper

Data scraper for St. Tammany Parish (Louisiana) code enforcement records.

## Overview

St. Tammany Parish uses **MGO Connect / MyGovernmentOnline** (NOT Tyler Energov) for permits and code enforcement tracking. This scraper provides access to:

1. **Administrative Hearing Dockets** (PDF) - No authentication required
2. **MGO Connect Solution Center** - Requires account for detailed searches

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run scraper
python sttammany_scraper.py
```

## Data Sources

### Administrative Hearing Dockets (No Auth Required)
- Source: St. Tammany Parish Civil Division of District Attorney
- Format: PDF documents
- Contains: Case numbers, addresses, violation types, hearing dates

### MGO Connect Solution Center (Auth Required)
- API: `https://www.mygovernmentonline.org/api/helper/`
- Jurisdiction ID: 34 (St. Tammany)
- To use: Create free account at https://www.mgoconnect.org

## Output

Results are exported to:
- `./output/sttammany_code_enforcement_TIMESTAMP.json`
- `./output/sttammany_code_enforcement_TIMESTAMP.csv`

## Key Findings

- St. Tammany Parish JurisdictionID: **34**
- Solution Center is online: **Yes**
- Platform: MGO Connect (South Central Planning & Development Commission)
- NOT Tyler Energov

## File Structure

```
sttammany-scraper/
├── README.md
├── requirements.txt
├── TECHNICAL_ASSESSMENT.md    # Full technical analysis
├── sttammany_scraper.py       # Main scraper code
├── cache/                      # Downloaded PDFs
└── output/                     # Exported data
```

## Contact

Parish Permits & Inspections:
- Phone: 985-646-4166
- Address: 21454 Koop Drive, Building B, Ste. 1B, Mandeville, LA 70471
