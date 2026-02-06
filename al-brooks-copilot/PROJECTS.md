# Project Buckets for Discovery Pipeline

Two AI trading projects. Discoveries get tagged with which project(s) they help.

---

## 🎯 Project A: Al Brooks Copilot (ACTIVE)

**Status**: Active development  
**Focus**: AI-assisted discretionary trading using Al Brooks price action methodology

**What it is**:
- Pattern detection from OHLC bars (168 patterns)
- Retrieval system for 12k+ slides, books, transcripts
- Regime inference (probabilistic reasoning about market state)
- Decision engine (ACT/WAIT/DISCARD)
- Live trading HUD connected to NinjaTrader

**Tech stack**:
- Multi-modal (text, images, time series)
- LLMs for reasoning and synthesis
- Vector DB for retrieval
- Vision ML for slide extraction

**Current bottlenecks**:
1. Regime inference (no probabilistic model yet)
2. Decision engine (structured output reliability)
3. Retrieval speed (needs to be faster for live)
4. Vision pipeline (12k slides to extract)

**What would help**:
- Time series foundation models (regime detection)
- Structured output guarantees (Instructor)
- Faster retrieval (LightRAG, rerankers)
- Agent orchestration (for crash recovery)

---

## 📊 Project B: Quant Ensemble System (QUEUED)

**Status**: Queued (after Al Brooks Copilot)  
**Focus**: Automated strategy generation, selection, and portfolio optimization

**What it is**:
- Grammatical Evolution → generates trading strategies
- Clustering → groups similar strategies
- NSGA-II → multi-objective portfolio selection (weekly)
- Meta ML → ensemble across multiple portfolios
- Full backtesting + dashboards

**Tech stack**:
- Classical ML/optimization (single modality — numbers only)
- 128-core server ready
- Data pipeline already set up

**What would help**:
- Evolutionary algorithm libraries (DEAP, PyGAD)
- Portfolio optimization tools
- Time series foundation models (feature extraction, regime labels)
- Backtesting frameworks (vectorbt, backtesting.py)
- Dashboard tools (Streamlit, Grafana)
- Experiment tracking (MLflow, Weights & Biases)

**Why waiting**:
- Al Brooks project is harder, do it first
- More tools will emerge while waiting
- Classical ML is well-understood, faster to build later

---

## Overlap

Some tools help BOTH projects:

| Tool | Project A | Project B | Why |
|------|-----------|-----------|-----|
| TimesFM | ✅ Regime inference | ✅ Feature extraction, regime labels | Time series foundation model |
| Experiment tracking | ✅ Decision log | ✅ Strategy evolution tracking | Both need to track what works |
| Backtesting | ⚠️ Playback mode | ✅ Core functionality | Both test against historical data |

---

## Discovery Tagging

Each discovery gets tagged:
- `[A]` = Helps Al Brooks Copilot
- `[B]` = Helps Quant Ensemble
- `[A+B]` = Helps both

Focus on `[A]` items now. Log `[B]` items for later.
