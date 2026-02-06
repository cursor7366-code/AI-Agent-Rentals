# Operator Review Protocol v1.0

**Status:** ACTIVE  
**Scope:** All CLAW pipelines (v3 PDF, v4 HTML pending)  
**Last Updated:** 2025-01-27  

---

## Purpose

Turn extracted public records into economic insight through structured human review.  
This protocol defines **what to look at**, **when**, and **what to do about it**.

No automation. No alerts. Human judgment only.

---

## 1. Review Cadence

### Daily Review (≤10 minutes)
- **When:** Morning, before other work
- **Goal:** Catch time-sensitive opportunities (upcoming sales, imminent hearings)
- **Max records:** 20

### Weekly Review (≤30 minutes)
- **When:** Friday afternoon or Monday morning
- **Goal:** Spot patterns, validate data quality, update prioritization rules
- **Max records:** 50 (sampled across the week)

---

## 2. Review Inputs

### Pipeline Outputs Reviewed

| Pipeline | Source | Format | Location |
|----------|--------|--------|----------|
| v3 (PDF) | 24JDC Court Calendar | JSON array | `24jdc_pipeline_v3` output |
| v4 (HTML) | JPSO Sheriff Sales | JSON array | `jpso_sales_v4` output (pending) |

### Review Format

**Daily:** Scan JSON output directly or pipe through `jq` for table view:
```bash
cat output.json | jq -r '.[] | [.case_id, .hearing_date, .party_plaintiff, .completeness_score] | @tsv'
```

**Weekly:** Export to spreadsheet or markdown table for pattern review.

### Record Limits

- **Daily:** Review first 20 records sorted by date (soonest first)
- **Weekly:** Random sample of 50 records from full week's output

---

## 3. Prioritization Rules

### Rank Order (Review in This Sequence)

1. **Imminent dates** — Sale/hearing within 7 days
2. **High dollar amounts** — Writ amount > $100,000 (sheriff sales)
3. **Complete records** — `completeness_score` ≥ 0.85
4. **Known entity match** — Party name matches watchlist (if maintained)

### Signals That Make a Record "Worth Acting On"

| Signal | Why It Matters |
|--------|----------------|
| Sale date within 14 days | Time-sensitive opportunity window |
| Property address present | Enables physical inspection / due diligence |
| Both parties extractable | Higher confidence in data accuracy |
| Writ amount < appraised value | Potential arbitrage (sheriff sales) |
| Case type = Succession/Probate | Often motivated sellers |

### Signals Explicitly Ignored

| Signal | Why Ignored |
|--------|-------------|
| `completeness_score` < 0.3 | Too little data to act on — noise |
| `Address Not Available` | Cannot verify or inspect — skip |
| Dates > 60 days out | Too early — will appear in future reviews |
| OCR artifacts in party names | Unreliable identity — do not contact |

---

## 4. Action Outcomes

For **every reviewed record**, the operator MUST choose exactly ONE:

### ACT NOW
- Record warrants immediate follow-up
- Examples: Contact attorney, research property, prepare bid
- **Log:** Record ID + action taken + timestamp

### MONITOR
- Record is interesting but not urgent
- Move to weekly review queue
- **Log:** Record ID + reason for monitoring

### IGNORE
- Record is not actionable or relevant
- No further attention
- **Log:** None required (default)

**No other actions allowed.** Do not "maybe later" — decide now.

---

## 5. Feedback Capture

### Daily Log (Required)

After each daily review, append to `review_log.md`:

```markdown
## 2025-01-27 Daily Review

**Records reviewed:** 18  
**Time spent:** 8 min  

### ACT NOW (2)
- `24-1234` — Sale 2/3, address present, researching property
- `23-5678` — Succession case, contacting attorney

### MONITOR (3)
- `24-9999` — High value but date too far out
- `865-878` — Missing address, watching for update

### Notes
- Seeing many "Address Not Available" — possible data quality issue
```

### Weekly Summary (Required)

At end of weekly review, answer:

1. **What patterns emerged?** (e.g., "Most succession cases in Division A")
2. **What was actioned this week?** (count of ACT NOW)
3. **What should change in prioritization?** (rules to add/remove)
4. **Data quality observations?** (systematic extraction issues)

---

## 6. Protocol Boundaries

### This Protocol Does NOT Allow

- Automated alerts or notifications
- External integrations (email, SMS, Slack)
- Sharing raw data outside operator review
- Modifying pipeline code based on review findings
- Adding new data sources

### Changes to This Protocol Require

- Written justification
- Review of impact on existing workflows
- Explicit approval before implementation

---

## Appendix: Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│           DAILY REVIEW (≤10 min)                │
├─────────────────────────────────────────────────┤
│ 1. Load today's output (max 20 records)         │
│ 2. Sort by date (soonest first)                 │
│ 3. For each record:                             │
│    - Date within 14 days? → Priority            │
│    - Address present? → Actionable              │
│    - Completeness ≥ 0.85? → Trustworthy         │
│ 4. Mark: ACT NOW / MONITOR / IGNORE             │
│ 5. Log ACT NOW and MONITOR to review_log.md     │
└─────────────────────────────────────────────────┘
```

---

**Document Owner:** Operator  
**Review Cycle:** Monthly (or after 30 days of use)  
**Version:** 1.0
