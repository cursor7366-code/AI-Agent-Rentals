# Discovery Config — Daily Scan Parameters

> Defines what to search, where to search, and how to filter.

---

## Two Projects — Tag Discoveries

| Tag | Project | Status | Focus |
|-----|---------|--------|-------|
| `[A]` | Al Brooks Copilot | ACTIVE | LLM + retrieval + multi-modal trading assistant |
| `[B]` | Quant Ensemble | QUEUED | Grammatical evolution + NSGA-II + meta ML portfolios |
| `[A+B]` | Both | — | Tools that help both projects |

**Priority**: Focus on `[A]` items. Log `[B]` items for later.

See `PROJECTS.md` for full project descriptions.

---

## Search Keywords

### Primary (high relevance to project)
- `trading AI`
- `financial LLM`
- `time series transformer`
- `pattern detection ML`
- `retrieval augmented generation`
- `bayesian reasoning LLM`
- `chain of thought trading`
- `OHLC machine learning`
- `candlestick detection`
- `market regime detection`

### Secondary (general AI tooling)
- `LLM agent framework`
- `embedding model`
- `reranker`
- `vector database`
- `local LLM inference`
- `fine-tuning LoRA`
- `structured output LLM`
- `vision language model`

### Enterprise / Frameworks (whole systems)
- `AI agent platform`
- `enterprise AI infrastructure`
- `agent orchestration`
- `durable execution AI`
- `multi-agent system`
- `workflow orchestration ML`
- `MLOps platform`
- `AI copilot platform`
- `trading platform AI`
- `quantitative trading platform`

### Negative filters (skip these)
- `crypto` (unless specifically useful)
- `NFT`
- `web3`
- `tutorial` / `course` / `awesome-list`
- `demo only` / `no code`

---

## Sources

### GitHub (check daily)
- **Trending**: Python, past week, ML/AI topics
- **Search**: Keywords above, sorted by recently updated, stars > 50
- **Watch list orgs**: 
  - `langchain-ai`
  - `run-llama` (LlamaIndex)
  - `huggingface`
  - `openai`
  - `anthropics`
  - `microsoft` (guidance, autogen)
  - `stanfordnlp`

### HuggingFace (check daily)
- **Trending models**: text-generation, feature-extraction
- **Spaces**: trending, ML category
- **New datasets**: financial, time-series

### Newsletters (aggregate weekly)
- TLDR AI (daily)
- Ben's Bites (daily)
- The Batch (weekly)
- Latent Space (weekly)
- Import AI (weekly)

### Reddit (check 2-3x/week)
- r/MachineLearning — top posts
- r/LocalLLaMA — top posts, new releases
- r/algotrading — ML-related posts

### Other
- Hacker News — "Show HN" with AI/ML tags
- Product Hunt — AI category, launches
- arXiv — cs.LG, cs.AI (weekly scan for high-citation preprints)

### Enterprise / SaaS / Frameworks (check weekly)
- **Product Hunt** — AI infrastructure, developer tools launches
- **TechCrunch / VentureBeat** — AI startup announcements, funding rounds
- **Company blogs**:
  - Scale AI (Agentex, etc.)
  - Weights & Biases
  - Modal, Replicate, Together AI
  - Temporal, Prefect (workflow)
  - LangChain, LlamaIndex (new products)
- **AI Twitter/X** — @kaborja, @swyx, @simonw, etc.
- **"Awesome" lists** — for discovery only (then evaluate actual tools)
- **Y Combinator launches** — AI batch companies

---

## Discovery Categories

### 1. Tools (Individual Components)
Plug-in solutions for specific problems. Map to a module and time horizon.

| Module | Status | What Would Help |
|--------|--------|-----------------|
| **Pattern Detection** | ✅ Done | Nothing needed — 168 patterns implemented |
| **Signal Extraction** | 🔄 Pending | Feature engineering, time-series features |
| **Regime Inference** | 🔄 Pending | Probabilistic models, foundation models, Bayesian reasoning |
| **Retrieval** | ✅ Working | Faster search, better reranking, improved embeddings |
| **Decision Engine** | 🔄 Pending | Structured output, decision frameworks, agent patterns |
| **Vision Pipeline** | 📋 Planned | YOLO alternatives, chart OCR, annotation detection |
| **Training/Playback** | ✅ Working | Experiment tracking, backtesting frameworks |
| **Live Integration** | 🔄 Pending | Real-time inference, low-latency models, execution |

### 2. Frameworks (Whole System Architectures)
Big-picture systems that could change the overall architecture. Higher stakes — need deep evaluation.

**What to look for:**
- Agent orchestration frameworks (like Agentex, AutoGen, CrewAI)
- Full trading platforms (could replace custom infra)
- Complete RAG systems (could replace retrieval stack)
- Workflow engines (could replace custom pipelines)

**Evaluation questions:**
- Does it solve multiple problems at once?
- What's the migration cost?
- What dependencies does it add?
- Can we adopt incrementally or is it all-or-nothing?
- Is it actively maintained by a real org?

## Current Bottlenecks (Highest Priority)

*Discoveries that solve these = NOW or SHORT term.*

1. **Regime inference** — need probabilistic reasoning about market state (BLOCKING)
2. **Decision engine** — need reliable structured output from LLMs (BLOCKING)
3. **Retrieval speed** — semantic search needs to be faster for live trading
4. **Vision pipeline** — extracting OHLC from 12k slides

---

## Report Format

Daily report saved to: `al-brooks-copilot/discovery/YYYY-MM-DD.md`

```markdown
# Discovery Report — YYYY-MM-DD

## Summary
- X new items found
- Y promoted to higher priority
- Z rejected

## New Discoveries

### [Tool Name]
- **Source**: GitHub / HuggingFace / Newsletter
- **Category**: Retrieval / Reasoning / Vision / etc.
- **What it does**: One sentence
- **Why interesting**: How it might help
- **Maturity check**: Stars, last commit, issues
- **Initial verdict**: HIGH / MEDIUM / LOW / WATCHING / REJECT
- **Link**: URL

## Status Changes
- [Tool] moved from WATCHING → MEDIUM (reason)
- [Tool] moved to REJECTED (reason)

## Notes
- Any patterns, trends, or observations
```

---

## Automation

**Frequency**: Daily scan, 6:00 AM UTC
**Method**: Cron job spawns sub-agent with discovery task
**Output**: Report in `discovery/` folder + TECH_RADAR.md updates
