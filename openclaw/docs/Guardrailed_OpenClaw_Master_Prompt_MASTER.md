# OpenClaw OpInt V3: Unified & Optimized

## Context

- **Previous Plans**: Consolidates `openclaw_opint_master` (high-level goals) and `openclaw_opint_hardened` (operational specs) into a single actionable V3 plan.
- **Goal**: A private, deterministic, efficiency-first opportunity intelligence pipeline that monitors public sources, extracts data to strict schemas, and reports deltas without drift or hallucinations.
- **Authoritative Guardrails (MUST READ / MUST IMPLEMENT)**:
  - This document is the canonical spec for: scope boundaries, prohibitions, determinism rules, and JSON output contracts.
  - **If anything is ambiguous during implementation, you MUST mark it as UNKNOWN / NULL and quarantine or stop (per rules below). You do NOT invent.**

## Definitions (use these exact meanings; do not rename / reinterpret)

- **Owner**: the private operator. The system serves the Owner first.
- **Cycle**: a single bounded run with hard limits (sources/pages/runtime). A cycle always ends in STOP (no self-trigger loops).
- **Source**: a predefined public URL or public file endpoint from the Owner-approved list (`sources.json`).
- **Record**: one real-world item (filing/docket/notice/permit/etc.) present in a source.
- **Event ID**: a stable deterministic identifier for a record (used for dedup + change detection).
- **Signal**: a record (or change in a record) that matches an explicit deterministic rule and is eligible to appear in summaries.
- **NULL**: explicit missing value. If information is not explicitly present, it is NULL (not guessed).
- **Report**: a forwardable output package: PDF + CSV + run manifest + anomaly/quarantine logs (when applicable).

## Scope = Data Domains (NO SCOPE CREEP)

- Primary (implement first; do not add new domains without explicit Owner instruction):
  - County / Parish Clerk Filings
  - Civil Court Dockets
  - Code Violations & Compliance Notices
  - Permit Applications, Withdrawals, Failures
  - Tax Delinquency & Tax Sales
- Secondary (optional; only after Primary is stable):
  - Business Formations / Dissolutions
  - Government Grants & Public Funding Notices
  - Asset Liquidations & Surplus Auctions

## Absolute Prohibitions (implementation must enforce these as "cannot happen")

- No logins/accounts, no captcha solving, no paywall bypass, no robots/TOS evasion.
- No contacting humans, no outreach, no posting, no purchases/subscriptions.
- No UI/dashboard/SaaS. This is a local-first batch pipeline.
- No schema drift: do not change schemas or add output fields without an explicit change report + Owner approval.

## Determinism / Non-Hallucination Rules (enforced, not "prompted")

- Missing data MUST be `null` (not omitted if required; not guessed).
- LLM calls (if/when used) MUST be: `temperature=0`, `top_p=1`, JSON-only, validated against the contract; invalid JSON = failure.
- Sorting for diffs/reports MUST be stable and specified (see Phase 3).

## Stop vs Quarantine (no improvisation)

- **STOP (cycle-level fatal)** on: missing required config files, invalid JSON contract from LLM, sandbox/container execution failures that prevent safe parsing, or any attempt to bypass egress controls.
- **QUARANTINE (record-level non-fatal)** on: low confidence OCR fields, partial extraction where schema-required values are `null`, missing/unstable `event_id`, or schema validation failures for a single record while the rest of the cycle can proceed.
