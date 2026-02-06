---
name: Agentex Evaluation for Trading-Copilot
overview: Research and analysis of Agentex open-source infrastructure for enterprise AI agents and how it can benefit the Trading-Copilot project
status: EVALUATING
decision: PENDING
todos: []
isProject: false
---

# Agentex Evaluation for Trading-Copilot

## Executive Summary

**Agentex** is an open-source agentic infrastructure layer from Scale AI that enables building, deploying, and scaling enterprise AI agents. It provides durable execution, state management, and multi-agent coordination—capabilities that could significantly enhance the Trading-Copilot's live trading loop and agent orchestration.

**Key Value Proposition**: Agentex solves several challenges currently present in Trading-Copilot's architecture, particularly around state persistence, crash recovery, and scaling complex multi-agent workflows.

---

## What is Agentex?

### Core Capabilities

1. **Five Levels of Agent Sophistication** (L1-L5)
   - L1-L3: Synchronous request/response (chatbots, task-based)
   - L4-L5: Fully autonomous, distributed, asynchronous agents
   - Trading-Copilot currently operates at ~L3 (sync fast/slow agents)

2. **Durable Execution via Temporal**
   - Agents survive crashes, restarts, and scaling events
   - State consistency maintained across failures
   - Critical for live trading systems that cannot lose context

3. **Multi-Agent Systems**
   - Native support for agents that use sub-agents
   - Agent Developer Kit (ADK) for inter-agent messaging
   - Perfect for coordinating FastAgent + SlowAgent + TreeAgent

4. **Cloud-Agnostic & Kubernetes-Native**
   - Zero-ops deployment capabilities
   - Scale hundreds of agents independently
   - Minimal infrastructure overhead

5. **Open Source (Apache 2.0)**
   - Full source code available
   - Python SDK + REST API
   - Local development with full UI

---

## Current Trading-Copilot Architecture

### Existing Agent Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│                  Current Architecture                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  NT8 JSONL → Orchestrator → FastAgent (Gemini Flash)    │
│                    │                                     │
│                    ↓                                     │
│              └──→ SlowAgent (GPT-4) [every 6 bars]      │
│                    │                                     │
│                    └──→ TreeAgent (O3) [decision tree]  │
│                                                          │
│  Issues:                                                 │
│  • State stored in-memory (AssistantState)              │
│  • No crash recovery                                     │
│  • Manual orchestration logic                           │
│  • No built-in async/long-running workflows             │
│  • Scaling requires custom implementation               │
└─────────────────────────────────────────────────────────┘
```

### Current Components

1. **AssistantOrchestrator** (`src/agents/orchestrator.py`)
   - Coordinates FastAgent + SlowAgent on bar close
   - Maintains `AssistantState` in-memory
   - Manual state management (recent_snapshots, recent_fast)

2. **FastAgent** (Gemini Flash)
   - Called every bar close
   - < 500ms latency requirement
   - Stateless (receives full context each call)

3. **SlowAgent** (OpenAI GPT-4)
   - Called every 6 bars
   - 2-5 second latency acceptable
   - Maintains higher-level context

4. **TreeAgent** (`src/agents/tree_agent.py`)
   - O3-powered decision tree agent
   - Manages scenario branches and probabilities
   - Streaming intrabar context support

---

## How Agentex Can Help Trading-Copilot

### 1. **Durable State Management** ⭐ HIGHEST VALUE

**Current Problem**:
- `AssistantState` is in-memory only
- Crashes lose all session context
- No recovery mechanism for interrupted trading sessions

**Agentex Solution**:
- Temporal-backed durable execution
- State automatically persisted and recoverable
- Agents resume exactly where they left off after crashes

**Impact**: Critical for live trading where losing context = losing money

---

### 2. **Multi-Agent Coordination** ⭐ HIGH VALUE

**Current Problem**:
- Manual orchestration in `AssistantOrchestrator`
- FastAgent/SlowAgent coordination is custom logic
- No standardized way to add new agent types

**Agentex Solution**:
- Native multi-agent system with ADK
- Standardized agent-to-agent messaging
- Easy to add new agents (e.g., PatternDetectorAgent, SignalExtractorAgent)

**Impact**: Cleaner architecture, easier to extend, better separation of concerns

---

### 3. **Async/Long-Running Agents** ⭐ HIGH VALUE

**Current Problem**:
- All agents are synchronous
- SlowAgent blocks even though it runs infrequently
- No background agents for pattern detection, signal extraction

**Agentex Solution**:
- Native async agent support (L4+)
- Agents can run in background, triggered by events
- Perfect for:
  - Pattern detection agents (run continuously, update on pattern found)
  - Signal extraction agents (process slides/transcripts async)
  - Playback training agents (long-running backtests)

**Impact**: Better latency characteristics, enables background processing

---

### 4. **Playback Training Agents** ⭐ MEDIUM VALUE

**Current Problem**:
- No dedicated infrastructure for playback/replay agents
- Training workflows are ad-hoc scripts
- No state management for long-running backtests

**Agentex Solution**:
- Long-running agents perfect for playback scenarios
- Durable execution means backtests survive interruptions
- Can run multiple playback agents in parallel (different strategies)

**Impact**: More robust backtesting infrastructure

---

## Decision Matrix

| Factor | Weight | Current | With Agentex | Score |
|--------|--------|---------|--------------|-------|
| **Crash Recovery** | 10 | 0/10 (no recovery) | 10/10 (automatic) | +100 |
| **State Persistence** | 9 | 2/10 (in-memory) | 10/10 (durable) | +72 |
| **Multi-Agent Coordination** | 8 | 5/10 (manual) | 9/10 (native) | +32 |
| **Async Support** | 7 | 0/10 (none) | 10/10 (native) | +70 |
| **Latency (FastAgent)** | 10 | 10/10 (< 500ms) | 7/10 (may increase) | -30 |
| **Migration Effort** | 6 | 10/10 (none) | 4/10 (significant) | -36 |
| **Learning Curve** | 5 | 10/10 (familiar) | 6/10 (new framework) | -20 |
| **Enterprise Features** | 4 | 3/10 (custom) | 9/10 (built-in) | +24 |
| **Total** | | **40/70** | **65/70** | **+212** |

**Net Score: +212** → **Strong positive value**

---

## Risks

🔴 **FastAgent Latency**: Temporal overhead might push FastAgent over 500ms threshold
- **Mitigation**: Keep FastAgent as direct sync call, use Agentex for SlowAgent/TreeAgent only

🟡 **Migration Complexity**: Refactoring orchestrator is non-trivial
- **Mitigation**: Phased migration (start with SlowAgent, then TreeAgent, then orchestrator)

🟢 **Dependency Management**: Adds Temporal + Agentex dependencies
- **Mitigation**: Well-maintained open source, Apache 2.0 license

---

## Recommended Approach

### Phase 1: Proof of Concept (1-2 weeks)
1. Set up Agentex locally (`./dev.sh`)
2. Migrate SlowAgent to Agentex async agent
3. Test durability (crash recovery, state persistence)
4. Measure latency impact

**Success Criteria**:
- SlowAgent works as Agentex agent
- State persists across restarts
- Latency acceptable (< 5s)

### Phase 2: TreeAgent Migration (1-2 weeks)
1. Migrate TreeAgent to Agentex
2. Implement durable DecisionTree state
3. Test scenario management with Agentex

### Phase 3: Background Agents (2-3 weeks)
1. Create PatternDetectionAgent (async)
2. Create SignalExtractionAgent (async)
3. Integrate with main pipeline

### Phase 4: Orchestrator Migration (2-3 weeks)
1. Migrate Orchestrator to Agentex agent
2. Use ADK for multi-agent coordination
3. Full state persistence

---

## Conclusion

**Agentex is highly valuable for Trading-Copilot**, particularly for:
1. **Durable state management** (solves crash recovery)
2. **Multi-agent coordination** (cleaner architecture)
3. **Async agents** (better latency, background processing)
4. **Long-running workflows** (playback training)

**Recommendation**: **Proceed with Phase 1 POC** to validate latency impact on FastAgent. If acceptable, proceed with phased migration starting with SlowAgent and TreeAgent.

**Key Risk**: FastAgent latency may be impacted by Temporal overhead. Mitigate by keeping FastAgent as direct sync call initially, using Agentex for async agents only.

---

## Resources

- **Agentex GitHub**: https://github.com/scaleapi/scale-agentex
- **Agentex Docs**: https://agentex.sgp.scale.com/docs
- **Python SDK**: https://github.com/scaleapi/scale-agentex-python
- **Scale AI Blog**: https://scale.com/blog/agentex
- **Temporal Docs**: https://docs.temporal.io/develop/python

---

*Analysis Date: 2025-02-03*
*Status: EVALUATING*
*Next Step: Decide whether to proceed with Phase 1 POC*
