# Tech Radar — AI Trading Project

> Tracking tools by **when to implement** and **what part of the system they help**.

**Last Updated**: 2026-02-06

---

## 🏗️ FRAMEWORK IDEAS — Whole System Architectures

*Big-picture frameworks and enterprise products that could change how the entire system works. Higher risk, higher reward. Needs deep evaluation before committing.*

### Open Source Frameworks

| Framework | What It Is | How It Could Help | Risk | Status | Last Checked |
|-----------|-----------|-------------------|------|--------|--------------|
| [Agentex](https://github.com/scaleapi/scale-agentex) | Scale AI's agent infrastructure — durable execution, multi-agent coordination, Temporal-backed state | Solves crash recovery, state persistence, async agents. Could replace custom orchestrator. | Medium — adds Temporal dependency, latency risk for FastAgent | 📋 Evaluating | 2026-02-03 |
| [AutoGen](https://github.com/microsoft/autogen) | Microsoft's multi-agent conversation framework | Multi-agent coordination, could help with FastAgent/SlowAgent/TreeAgent orchestration | Medium — may be overkill | 👀 Watching | 2026-02-03 |
| [CrewAI](https://github.com/joaomdmoura/crewAI) | Role-based multi-agent framework | Agent roles and coordination patterns | Medium — newer, less battle-tested | 👀 Watching | 2026-02-03 |
| [Temporal](https://temporal.io) | Durable execution / workflow engine | Crash recovery, state persistence (what Agentex uses under the hood) | Low — very mature | 👀 Watching | 2026-02-03 |

### Enterprise / SaaS Products

| Product | What It Is | How It Could Help | Pricing | Status | Last Checked |
|---------|-----------|-------------------|---------|--------|--------------|
| [Modal](https://modal.com) | Serverless GPU/CPU compute | Fast inference, background jobs, could run SlowAgent/vision pipeline | Free tier, then usage-based | 👀 Watching | 2026-02-03 |
| [Weights & Biases](https://wandb.ai) | Experiment tracking + model registry | Track decision log, A/B test prompts, version models | Free tier | 👀 Watching | 2026-02-03 |
| [LangSmith](https://smith.langchain.com) | LLM observability + testing | Debug LLM calls, trace retrieval, evaluate prompts | Free tier | 👀 Watching | 2026-02-03 |
| [Braintrust](https://braintrust.dev) | LLM evaluation platform | Test prompts, compare models, track regressions | Free tier | 👀 Watching | 2026-02-03 |

### Framework Evaluation Criteria

Unlike tools (plug in and use), frameworks require:
1. **Architecture fit** — Does it align with how we want the system to work?
2. **Migration cost** — How much refactoring to adopt?
3. **Lock-in risk** — Can we back out if it doesn't work?
4. **Dependency weight** — What new deps does it bring?
5. **Team learning curve** — How long to become productive?

### Framework Status Legend
- 📋 **Evaluating** — Reading docs, assessing fit
- 🧪 **POC** — Building proof of concept
- ✅ **Adopting** — Decided to use, implementing
- ❌ **Rejected** — Evaluated, decided against (with reason)
- ⏸️ **Paused** — Good idea, but not right time

---

## System Modules

| Module | Status | Current Bottleneck |
|--------|--------|-------------------|
| **Pattern Detection** | ✅ Done | 168 patterns implemented |
| **Signal Extraction** | 🔄 Pending | Need to build signal_extractor.py |
| **Regime Inference** | 🔄 Pending | Need probabilistic reasoning for market state |
| **Retrieval** | ✅ Working | Could be faster, could get better chunks |
| **Decision Engine** | 🔄 Pending | ACT/WAIT/DISCARD logic not built |
| **Vision Pipeline** | 📋 Planned | YOLOv8 for 12k slides |
| **Training/Playback** | ✅ Working | Deterministic replay exists |
| **Live Integration** | 🔄 Pending | NT8 connection, HUD |

---

## ⚡ NOW — Implement This Week

*Solves an immediate bottleneck. Ready to integrate.*

| Tool | Project | Module | What It Does For You | Effort | Last Checked | Stars |
|------|---------|--------|---------------------|--------|--------------|-------|
| [Instructor](https://github.com/567-labs/instructor) | [A] | Regime Inference, Decision Engine | Guarantees your LLM always returns valid structured output. No more parsing failures. Note: Use pydantic-ai for complex agents. | 2 hours | 2026-02-06 | 12.3k |
| [Google TimesFM 2.5](https://github.com/google-research/timesfm) | [A+B] | Regime Inference | **UPDATED to 2.5!** Now 200M params (was 500M), 16k context (was 2048), continuous quantile forecasts. Feed OHLC bars → get regime probabilities with longer history. | 1-2 days | 2026-02-06 | 7.7k |
| 🔥 [TradingAgents v0.2.0](https://github.com/TauricResearch/TradingAgents) | [A] | Decision Engine, Live | **BUMPED FROM SHORT!** Multi-agent LLM trading framework with v0.2.0 multi-provider support (GPT-5.x, Claude 4.x, Gemini 3.x). Steal patterns for analyst team, debate architecture, risk management. | 2-3 days | 2026-02-06 | 29.2k |

---

## 🗓️ SHORT TERM — Next 2-4 Weeks

*Good fit, needs some research/testing first.*

| Tool | Project | Module | What It Does For You | Why Not Now | Last Checked | Stars |
|------|---------|--------|---------------------|-------------|--------------|-------|
| 🔥 [Aurora](https://github.com/DecisionIntelligence/Aurora) | [A] | Regime Inference, Signal Extraction | **NEW!** ICLR 2026 multimodal time series model. Inject text context (news, Fed days, market regime) alongside OHLC for context-aware predictions. First true multimodal TSF model. | Need POC to test text injection quality | 2026-02-06 | — |
| [Ensue](https://github.com/mutable-state-inc/ensue-skill) | [A] | Agent Memory | Persistent shared memory for Claude Code sessions. Project context survives across chats. | Need to test vs claude-mem | 2026-02-05 | — |
| [claude-mem](https://github.com/thedotmack/claude-mem) | [A] | Agent Memory | Compresses session history, injects relevant context into future sessions. Memory continuity. | Compare with Ensue, pick one | 2026-02-05 | — |
| [Moondream 3](https://moondream.ai/) | [A] | Vision Pipeline | Tiny vision model (runs local) for practical image questions. Chart pattern recognition candidate. | Test on sample charts first | 2026-02-05 | — |
| [LightRAG](https://github.com/HKUDS/LightRAG) | [A] | Retrieval | 10x faster semantic search. Your "ALWAYS RUN" retrieval becomes fast enough for live. | Need to benchmark vs current LanceDB | 2026-02-04 | 27.9k |
| [Lag-Llama](https://github.com/time-series-foundation-models/lag-llama) | [A+B] | Regime Inference | Outputs probability distributions, not point estimates. Perfect for confidence scores. | Verify it works at 5-min bar scale | 2026-02-03 | 1.5k |
| [Rankify](https://github.com/DataScienceUIBK/Rankify) | [A] | Retrieval | 24 reranking models in one package. Improves "getting the RIGHT chunks." | Current retrieval works, this is optimization | 2026-02-03 | 581 |
| [Amazon Chronos](https://github.com/amazon-science/chronos-forecasting) | [A+B] | Regime Inference | Alternative to TimesFM. Benchmark both to see which works better for 5-min bars. | Need to compare with TimesFM first | 2026-02-04 | 4.8k |

---

## 📅 MEDIUM TERM — 1-3 Months

*On the roadmap. Not urgent but valuable.*

| Tool | Project | Module | What It Does For You | When To Revisit | Last Checked | Stars |
|------|---------|--------|---------------------|-----------------|--------------|-------|
| [Salesforce MoiraiAgent](https://huggingface.co/Salesforce/moirai-agent) | [A] | Regime Inference, Ensemble | **NEW!** Meta-model that picks the best prediction from multiple forecasters. Run TimesFM + Chronos + Aurora → MoiraiAgent selects winner per situation. 3B params. | After core models working | 2026-02-06 | — |
| [pydantic-ai](https://github.com/pydantic/pydantic-ai) | [A] | Regime Inference, Decision Engine | Official agent runtime from Pydantic team. Instructor recommends it for agent workflows. Structured outputs + tools + observability. | Use for SlowAgent/TreeAgent | 2026-02-06 | 14.6k |
| [Time-MoE](https://github.com/Time-MoE/Time-MoE) | [A+B] | Regime Inference | Billion-param MoE model — different experts for trending vs ranging. More powerful than TimesFM. | After TimesFM evaluated | 2026-02-03 | 898 |
| [BCEmbedding](https://github.com/netease-youdao/BCEmbedding) | [A] | Retrieval | Better embeddings for your 300 summaries. Upgrade path for retrieval quality. | When retrieval quality is the bottleneck | 2026-02-03 | 1.8k |
| [RAGFlow](https://github.com/infiniflow/ragflow) | [A] | Retrieval | Full RAG engine with agent capabilities. Could replace custom retrieval stack. | If current approach hits limits | 2026-02-03 | 72.7k |
| [AutoRAG](https://github.com/Marker-Inc-Korea/AutoRAG) | [A] | Retrieval | AutoML for RAG optimization. Auto-tunes chunking, embedding, retrieval strategies. | Once basic retrieval works | 2026-02-04 | 4.6k |
| [flow-forecast](https://github.com/AIStream-Peelout/flow-forecast) | [A] | Regime Inference | PyTorch time series library with built-in anomaly detection. Could trigger regime reassessment on anomalies. | Benchmark alongside TimesFM | 2026-02-05 | 2.3k |
| [Livedocs](https://livedocs.com/) | [A] | Data Analysis | Natural language → SQL on your data. "Which setups had best win rate?" type queries on pattern DB. | Need pattern database first | 2026-02-05 | — |
| [Exa](https://exa.ai/) | [A] | Retrieval | Web search API returning clean text/summaries. Market news retrieval for regime signals. | Not critical path yet | 2026-02-05 | — |

---

## 🔭 LONG TERM — 3+ Months / Watching

*Interesting but too early, or needs the project to mature first.*

| Tool | Project | Module | What It Does For You | Check Back | Last Checked | Stars |
|------|---------|--------|---------------------|------------|--------------|-------|
| [TimeCopilot](https://github.com/TimeCopilot/timecopilot) | [A+B] | Regime Inference | Multi-model forecasting API. Query 3 models, aggregate answers. | 2026-02-20 | 2026-02-03 | 364 |
| [QuantDinger](https://github.com/brokermr810/QuantDinger) | [B] | Platform | Full trading platform. Research, backtesting, live execution. More relevant for Quant project. | 2026-02-15 | 2026-02-03 | 665 |
| [AI-Hedge-Fund-Crypto](https://github.com/51bitquant/ai-hedge-fund-crypto) | [A] | Decision Engine | Multi-agent trading architecture. Patterns to steal for your decision engine. | 2026-02-15 | 2026-02-03 | 506 |
| Agentex | [A] | Live Integration | Enterprise agent infrastructure. Crash recovery, state persistence. | 2026-02-15 | 2026-02-03 | — |
| [Lexoid](https://github.com/oidlabs-com/Lexoid) | [A] | Vision Pipeline | Multimodal document parser for structured extraction. Could understand slide layouts/annotations. | When vision pipeline starts | 2026-02-05 | 89 |
| [mHC-iTransformer](https://github.com/2308087369/mHC-iTransformer) | [A] | Regime Inference | New time series SOTA using DeepSeek's mHC architecture. Potentially more efficient. | 2026-02-20 (verify claims) | 2026-02-05 | 27 |
| [Recursive Language Models](https://www.primeintellect.ai/blog/rlm) | [A] | Agent Architecture | Agents store inputs in Python, delegate to sub-agents. Solves massive context problem for historical data. | 2026-02-20 (early research) | 2026-02-05 | — |
| [Gambit](https://github.com/bolt-foundry/gambit) | [A] | Agent Architecture | Agent harness — agents call agents in parallel. Markdown/TS interfaces. Auto-grades every turn. | 2026-02-15 | 2026-02-05 | — |
| [Sim](https://github.com/simstudioai/sim) | [A] | Agent Architecture | Drag-and-drop agent workflow builder, self-hostable, Ollama support. Quick prototyping. | 2026-02-15 | 2026-02-05 | — |
| [nano-vllm](https://github.com/GeeeekExplorer/nano-vllm) | [A] | Inference | Readable ~1,200-line vLLM reimplementation. Educational for understanding inference optimization. | Reference only | 2026-02-05 | — |
| [Nemotron-3 Nano](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16) | [A] | Local Models | 30B hybrid MoE, only ~3.5B active params. Reasoning toggle. Local reasoning option. | 2026-02-20 | 2026-02-05 | — |
| [NEAR AI Cloud](https://near.ai/cloud) | [A] | Inference | Qwen3 30B at $0.15/M tokens. Cheap bulk inference option for analysis. | When cost is bottleneck | 2026-02-05 | — |

---

---

## 📊 QUANT PROJECT BACKLOG [B]

*Items specifically for the Quant Ensemble project. Logged now, evaluate when that project starts.*

| Tool | Category | What It Does | Why Relevant | Stars |
|------|----------|--------------|--------------|-------|
| [DEAP](https://github.com/DEAP/deap) | Evolutionary | Distributed evolutionary algorithms in Python | Grammatical evolution, NSGA-II | 5.8k |
| [vectorbt](https://github.com/polakowo/vectorbt) | Backtesting | Fast vectorized backtesting | Strategy evaluation at scale | 4.2k |
| [PyPortfolioOpt](https://github.com/robertmartin8/PyPortfolioOpt) | Portfolio | Portfolio optimization library | Portfolio selection layer | 4.5k |
| [MLflow](https://github.com/mlflow/mlflow) | Experiment Tracking | ML experiment tracking and deployment | Track strategy evolution | 19k |

*More items will be added as discovered. Focus stays on [A] for now.*

---

## ✅ ADOPTED

| Tool | Module | Integrated | Result |
|------|--------|------------|--------|
| LanceDB | Retrieval | Existing | Semantic search for chunks |
| YOLOv8 | Vision Pipeline | Planned | OHLC extraction from slides |

---

## ❌ REJECTED

| Tool | Module | Reason |
|------|--------|--------|
| Various candlestick pattern repos | Pattern Detection | All <15 stars, abandoned. Custom approach necessary. |

---

## Module × Time Matrix

Quick reference: what helps what, and when.

| Module | NOW | SHORT | MEDIUM | LONG |
|--------|-----|-------|--------|------|
| **Pattern Detection** | — | — | — | — |
| **Signal Extraction** | — | Aurora | — | — |
| **Regime Inference** | TimesFM 2.5, Instructor | Aurora, Lag-Llama, Chronos | MoiraiAgent, Time-MoE, pydantic-ai, flow-forecast | TimeCopilot, mHC-iTransformer, RLM |
| **Retrieval** | — | LightRAG, Rankify | BCEmbedding, RAGFlow, AutoRAG, Exa | — |
| **Decision Engine** | Instructor, 🔥 TradingAgents | — | pydantic-ai, Livedocs | AI-Hedge-Fund patterns |
| **Vision Pipeline** | — | Moondream 3 | — | Lexoid |
| **Agent Memory** | — | Ensue, claude-mem | — | — |
| **Agent Architecture** | — | — | — | Gambit, Sim, RLM |
| **Training/Playback** | — | — | — | — |
| **Live Integration** | 🔥 TradingAgents | — | — | QuantDinger, Agentex |
| **Local Models** | — | — | — | Nemotron-3 Nano, NEAR AI |

---

## How This Updates

Daily heartbeat scan adds new discoveries. Items move between sections as:
- **Evaluation completes** → NOW/SHORT/MEDIUM/REJECT
- **Project needs change** → reprioritize based on current bottleneck
- **Tools mature** → LONG → MEDIUM → SHORT

---

## Current Priority

Based on your pending modules, the highest-value discoveries are:

1. **Regime Inference** — TimesFM, Instructor (NOW)
2. **Retrieval Speed** — LightRAG (SHORT)
3. **Decision Engine** — Instructor structured output (NOW)

Everything else can wait until these core pieces are working.
