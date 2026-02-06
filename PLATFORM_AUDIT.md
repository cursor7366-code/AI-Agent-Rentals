# Platform Audit — National Scalability Analysis

## Executive Summary

Your sources are powered by a small number of **national platforms**. Build one scraper per platform, configure per jurisdiction, scale to hundreds of counties.

---

## Platform Map

### TIER 1 — HIGH COVERAGE PLATFORMS (Build These First)

#### 1. Tyler Technologies (Court Records)
**What it powers:** Court dockets, civil filings, criminal records, clerk indexes
**Platform names:** Odyssey, re:SearchLA, Tyler Courts
**Louisiana coverage:** re:SearchLA covers MULTIPLE Louisiana parishes
**National coverage:** 1000+ courts nationwide
**Technical:** Web portal, likely JS-required but consistent structure across deployments

**Jurisdictions using Tyler (partial list):**
- St. Tammany Parish (via re:SearchLA)
- Many other Louisiana parishes
- Courts across Texas, Florida, Georgia, etc.

**Scalability:** HIGH — One scraper + config per jurisdiction = hundreds of courts

---

#### 2. Bid4Assets (Foreclosure Auctions)
**What it powers:** Tax sales, sheriff sales, foreclosure auctions, government surplus
**National coverage:** 100+ counties across USA
**Louisiana coverage:** Tangipahoa Parish (confirmed)
**Technical:** Web portal, JS-heavy but has structured auction listings

**Jurisdictions using Bid4Assets:**
- Tangipahoa Parish, LA (sheriff sales)
- Counties in CA, PA, WA, NV, MT, and 20+ other states

**Scalability:** HIGH — Same platform, different storefront URLs

---

#### 3. CivicSource (Tax Sales & Adjudicated Properties)
**What it powers:** Tax delinquency, adjudicated property sales, redemptions
**Louisiana coverage:** Tangipahoa Parish (confirmed), likely others
**Technical:** Web portal with property detail pages

**Scalability:** MEDIUM-HIGH — Same platform across Louisiana parishes

---

#### 4. Teleosoft County Suite (Sheriff Civil Divisions)
**What it powers:** Sheriff sales, civil process, judicial sales
**Louisiana coverage:** St. Tammany Parish (public.stpso.com)
**National coverage:** Unknown but likely other sheriff offices
**Technical:** JS-required portal (we hit this blocker earlier)

**Scalability:** MEDIUM — Need browser automation, but same code works across deployments

---

### TIER 2 — MEDIUM COVERAGE PLATFORMS

#### 5. GovQA (Public Records Requests)
**What it powers:** FOIA requests, public records portals
**Coverage:** Hundreds of agencies nationwide
**Note:** More for requesting records than scraping, but useful for one-off data pulls

---

#### 6. Accela / Granicus (Permits & Code Enforcement)
**What it powers:** Building permits, inspections, code violations
**Coverage:** Major cities nationwide
**Louisiana coverage:** Need to verify specific cities
**Technical:** Varies by deployment, some have APIs

---

#### 7. ZeusAuction (Tax Sales)
**What it powers:** Annual tax sales, auction bidding
**Louisiana coverage:** St. Tammany Parish
**Technical:** Auction platform, may require registration

---

### TIER 3 — LOCAL/CUSTOM SOLUTIONS

#### 8. Custom Government Websites
**What they are:** One-off websites built by local contractors
**Examples:** 
- Slidell condemned property list (PDF on city site)
- Hammond condemned property list (PDF)
- Parish bid postings pages

**Scalability:** NONE — Each requires custom scraper

**Strategy:** Build these LAST, only for high-value jurisdictions

---

## Your Source List — Mapped to Platforms

### St. Tammany Parish

| Source | Platform | Scalability | Priority |
|--------|----------|-------------|----------|
| Clerk filings | Tyler (re:SearchLA) | HIGH | 1 |
| Court dockets | Tyler (re:SearchLA) | HIGH | 1 |
| Sheriff sales | Teleosoft County Suite | MEDIUM | 2 |
| Tax sales | ZeusAuction | LOW | 4 |
| Code violations (Slidell) | Custom (PDF) | NONE | 5 |
| Permits | MyPermitNow | UNKNOWN | 3 |

### Tangipahoa Parish

| Source | Platform | Scalability | Priority |
|--------|----------|-------------|----------|
| Sheriff sales | Bid4Assets | HIGH | 1 |
| Tax sales | CivicSource | MEDIUM-HIGH | 2 |
| Clerk filings | Custom eSearch | LOW | 4 |
| Code violations (Hammond) | Custom (PDF) | NONE | 5 |
| Permits | mgoconnect | UNKNOWN | 3 |
| Bids/RFPs | Custom | NONE | 5 |

---

## Recommended Build Order

### Phase 1: Crack High-Coverage Platforms

| Priority | Platform | First Target | Scales To |
|----------|----------|--------------|-----------|
| 1 | **Bid4Assets** | Tangipahoa LA | 100+ counties nationwide |
| 2 | **CivicSource** | Tangipahoa LA | Louisiana + other states |
| 3 | **Tyler/re:SearchLA** | St. Tammany | 1000+ courts |

### Phase 2: Medium Coverage

| Priority | Platform | First Target | Scales To |
|----------|----------|--------------|-----------|
| 4 | **Teleosoft** | St. Tammany | Other sheriff offices |
| 5 | **Permit platforms** | Verify coverage first | Major cities |

### Phase 3: High-Value Custom

| Priority | Platform | Target | Notes |
|----------|----------|--------|-------|
| 6 | PDF/Custom | Condemned lists | Only where deal signal is strong |

---

## Technical Requirements by Platform

| Platform | Scrape Method | Difficulty | Browser Needed? |
|----------|---------------|------------|-----------------|
| Bid4Assets | HTML + maybe JS | Medium | Probably |
| CivicSource | HTML | Medium | Maybe |
| Tyler | Depends on deployment | Hard | Likely |
| Teleosoft | JS-required | Hard | Yes |
| PDF lists | pdftotext/OCR | Easy | No |

---

## The Money Insight

**If you crack Tyler, you own 1000 courts.**
**If you crack Bid4Assets, you own 100+ county tax sales.**
**If you crack CivicSource, you own Louisiana tax sales.**

The custom PDFs are nice-to-haves. The platforms are the empire.

---

## Next Step

Pick ONE platform. I'll build a scraper that:
1. Works for one jurisdiction
2. Takes a config file for jurisdiction-specific settings
3. Can be copied to new jurisdictions with just a config change

**My recommendation:** Start with **Bid4Assets** — it's national, high-value (foreclosure auctions), and likely the most consistent structure.

Which platform do you want to crack first?
