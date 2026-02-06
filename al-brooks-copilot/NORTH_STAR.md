---
description: "North Star - Trading & Training Rules - Strategic charter for Al Brooks Copilot system"
globs: "**/*"
alwaysApply: true
---

# NORTH STAR - TRADING & TRAINING RULES

> **What this document is**: The strategic charter for the Al Brooks Copilot system—its purpose, constraints, and governing principles.
>
> **What this document is NOT**: Coding style rules. Those live in `.cursorrules` at the project root.

## Document Scope

This project has **three distinct rule domains**:

| Domain | Governs | Location |
|--------|---------|----------|
| **Coding Rules** | How developers/agents write code | `.cursorrules` |
| **Trading Rules** | How the system assists trading decisions | This document (sections 1-6) |
| **Training Rules** | How the system learns from playback/live data | This document (section 8) |

## 1) Purpose

Build a **speed-first research system** for trading cognition that:
- maximizes *idea throughput* and time-to-feedback,
- preserves human responsibility for judgment,
- and turns repeated testing + review into durable constraints ("learned rules") that shrink future search space.

> Operating principle: **Reality is the first filter. Explanation is second.** (Personal Research Doctrine)

## 2) Core Beliefs (Non-Negotiable)

From *Personal Research Doctrine*:

- **Markets are adversarial and non-stationary.** Any edge is conditional and must continually re-earn its existence.
- **Speed of iteration is a competitive advantage.** Kill bad ideas fast to uncover robust structures.
- **Testing is thinking.** Insight is provisional until it touches data; results precede explanation.
- **Failure in research is capital preserved.** A failed test is a successful avoidance of live loss.
- **Judgment is human; execution is mechanical.** Tools accelerate reality contact; they do not replace responsibility.

## 3) The Research Loop (Trader Workflow)

Speed-first loop (must be supported by the system):

1. **Express the idea** as a Minimum Viable Hypothesis (testable, not justified).
2. **Run the test immediately.** Default bias toward execution.
3. **Evaluate against acceptability thresholds** (already internalized):
   - post-cost viability
   - drawdown tolerance
   - stability across basic regimes
   - absence of obvious structural artifacts
4. **Classify the outcome** (exactly one primary class):
   - Overfit / curve-fit
   - Regime fragility
   - Execution sensitivity
   - Poor asymmetry / tail risk
   - Structural logic failure
   - Portfolio interaction failure
   - Survives (tentatively)
5. **Decide immediately** (exactly one):
   - Kill permanently
   - Keep as-is
   - Retest with one controlled modification
6. **Store the result.** If the outcome is not recorded, the iteration did not happen.
7. **Extract the constraint (after the fact):**
   - What condition caused failure?
   - What rule does this add to reality?
   - How does this shrink future search space permanently?

## 4) What Success Looks Like

- High test volume with low emotional attachment
- Rapid discard of unpromising ideas
- Survivors that fail only in narrow, explainable conditions
- Increasing reuse of learned constraints
- Confidence derived from repetition, not conviction

## 5) Forbidden Behaviors (Hard Constraints)

### For Traders Using the System

- Delaying tests in favor of over-analysis
- Protecting an idea from failure
- Retrofitting narratives to save results
- Relaxing standards after seeing data
- Confusing novelty/complexity with edge

### For Automation / AI Agents

Agents **may**:
- implement tests instantly
- run batches of experiments
- enforce existing thresholds
- record outcomes and classifications

Agents **may not**:
- redefine success criteria
- override discard decisions
- allocate capital autonomously

> Principle: **Humans decide what matters. Systems decide what runs.**

## 6) Agent Constitution (How the Assistant Must Behave)

This project's assistant components must follow the "Trading Cognition Learner" constitution principles:

### Epistemics

- Knowledge is provisional, probabilistic, and conditional.
- Certainty is not a virtue; calibration under uncertainty is.
- No concept/signal has invariant meaning; expectancy is regime- and horizon-conditioned.

### Decision Formation

- Decisions are generated via probabilistic reasoning over conditional futures.
- The agent must acknowledge uncertainty in all decision states.
- Consistency of reasoning is valued above novelty or brilliance.

### Learning

- Wins do not imply truth; losses do not imply error.
- Beliefs revise only when evidence consistently changes expected outcomes.
- Counterfactuals are admissible only if they were plausible *at decision time* (no hindsight certainty).

### Success Definition

- survival across regimes
- repeatability of decision process
- disciplined management of uncertainty
- durable positive expected value over time
- "Less wrong in stable, repeatable ways" is sufficient.

### Supremacy Clause

These constitutional rules override local heuristics/objectives. Any optimization that violates them is invalid.

## 7) How This Doctrine Maps to the Codebase

### 7.1 Registry-First Truth (Artifact Governance)

Because iteration is fast and outputs multiply, the system must always answer:
- **What is current?**
- **What is best?**
- **Why?**
- **What changed?**

Non-negotiable invariants:
- The **registry is the single source of truth** for "current" selections.
- Selection is **deterministic** and **explainable** (no opaque magic-number scoring).
- History is preserved (bounded), and rollback is possible.
- Destructive operations require explicit confirmation flags.

**Implementation**: `scripts/sync_chunks.py` with `--explain`, `--promote`, `--rollback`.

### 7.2 Pipeline State Semantics (Chunk → Enrich → Index)

The pipeline states must be defined and enforced consistently. Minimum state meanings:

- **Chunked**: raw chunks exist (file artifacts or DB rows).
- **Enriched**: canonical tags (or equivalent enrichment fields) exist and are non-empty.
- **Indexed**: embeddings exist and are referentially valid when possible.

Important: "Indexed" should not automatically win if the index is stale relative to enrichment.

**Implementation**: `tools/mini_check.py` validates each stage; `active_context.md` tracks state.

### 7.3 Drift Detection (Mutable DBs)

For DB-backed assets (slides/transcripts):
- A DB path is not enough.
- Every DB selection must include a **fingerprint** (mtime, size, hash, schema/user_version).
- If the fingerprint changes, the system must surface a DIFF and treat it as a new candidate state.

**Implementation**: `sync_chunks.py` DB fingerprinting with `[DIFF]` markers.

## 8) Training Rules (Playback & Live Learning)

> **This section governs how the system learns from data**—distinct from coding rules (how we build) and trading rules (how traders use).

### 8.1 Data Modes

| Mode | Source | Purpose | Constraints |
|------|--------|---------|-------------|
| **Playback** | Historical NT8 JSONL, recorded sessions | Training, backtesting, evaluation | No real-time pressure; full reproducibility required |
| **Live** | Real-time NT8 JSONL stream | Production assistance | Latency-critical; learning is observation-only |

### 8.2 Playback Training Rules

When training or evaluating on playback data:

1. **Determinism is mandatory**
   - All seeds (random/numpy/torch) must be controlled and logged
   - Same input + same seed = identical output
   - No stochastic behavior without explicit `--allow-stochastic` flag

2. **No data leakage**
   - Strict train/val/test splits by time (not random shuffle)
   - Future bars never visible during training on past bars
   - Cross-split contamination = invalid experiment

3. **Provenance is non-negotiable**
   - Every training run writes: config, git commit, data fingerprint, seed, timestamp
   - Results without provenance are inadmissible
   - Format: `out/training_runs/<timestamp>_<run_id>/manifest.json`

4. **Regime labeling**
   - Training data must be labeled by regime (trend/range/breakout) when available
   - Performance metrics must be broken out by regime
   - "Works in aggregate" is not sufficient; must work per-regime

5. **Outcome classification required**
   - Every trained model/rule must be classified per section 3.4
   - No model graduates to live without explicit survival classification

### 8.3 Live Data Rules

When operating on live data:

1. **Observation-only learning**
   - Live mode may *observe* patterns and *log* potential learnings
   - Live mode may NOT *update* model weights or thresholds
   - Learning happens offline, on playback, after session ends

2. **Fail-safe defaults**
   - If retrieval fails: return empty evidence, log warning, continue
   - If agent fails: surface error to HUD, do not crash
   - If latency exceeds threshold: skip slow model, use fast-only

3. **Audit trail**
   - Every live decision is logged to `docs/experience_log.jsonl`
   - Format: `{timestamp, bar_number, query, evidence_ids, agent_output, user_feedback?}`
   - User feedback (accept/reject/modify) is captured when provided

4. **No hindsight contamination**
   - Explanations generated live must not reference future bars
   - "What I would have done differently" is inadmissible in live mode
   - Post-session review is allowed only on playback replays

### 8.4 Feedback Loop (Live → Playback → Improved)

```
┌─────────────────────────────────────────────────────────────┐
│                      LIVE SESSION                           │
│  NT8 JSONL → Retrieval → Agent → HUD → User Feedback        │
│                          ↓                                  │
│                 experience_log.jsonl                        │
└─────────────────────────────────────────────────────────────┘
                           ↓ (session ends)
┌─────────────────────────────────────────────────────────────┐
│                    PLAYBACK REVIEW                          │
│  Replay session → Evaluate decisions → Extract constraints  │
│                          ↓                                  │
│  Update: prompts / retrieval weights / tag hierarchies      │
└─────────────────────────────────────────────────────────────┘
                           ↓ (validated offline)
┌─────────────────────────────────────────────────────────────┐
│                   NEXT LIVE SESSION                         │
│  Improved system deployed → Observe → Log → Repeat          │
└─────────────────────────────────────────────────────────────┘
```

### 8.5 What the System May Learn

| Learnable | Method | Constraint |
|-----------|--------|------------|
| Retrieval weights | Offline tuning on playback | Must improve recall@k on held-out set |
| Tag hierarchies | Manual + validated offline | Changes logged to decision_log |
| Prompt templates | A/B tested on playback | No live A/B without explicit flag |
| Confidence thresholds | Calibrated on playback | Must maintain calibration across regimes |

### 8.6 What the System May NOT Learn (Hard Stops)

- **Position sizing**: Human decision only
- **Entry/exit execution**: Human decision only
- **Risk limits**: Human-set, system-enforced, never system-modified
- **Success criteria**: Defined by human, enforced by system
- **Capital allocation**: Absolutely forbidden for automation

## 9) Cursor/LLM Development Contract

When editing the repo:

- Read this document first.
- Preserve the non-negotiables above.
- Prefer **small, reversible changes**.
- Add `--explain`/debuggability whenever selection logic changes.
- Never "make it pass" by weakening thresholds after seeing results.
- If data is missing, mark it unknown; do not invent.

Acceptance criteria for changes affecting artifact selection:
- Deterministic ordering (tie-breakers defined)
- `--explain` shows labeled rank components
- Registry updates are atomic
- Drift is detectable for DB selections
- History + rollback/snapshots are safe and conservative by default

## 10) Glossary

- **Acceptability thresholds**: pre-existing risk/quality bounds used to judge tests.
- **Constraint**: a reusable rule extracted from outcomes that shrinks future search space.
- **Registry**: stored state of "current" artifact versions + candidate history.
- **Stale index**: embeddings/index not updated to match newer enrichment/content.
- **Playback**: historical data replay for training/evaluation (offline, reproducible).
- **Live**: real-time data stream for production assistance (observation-only learning).
