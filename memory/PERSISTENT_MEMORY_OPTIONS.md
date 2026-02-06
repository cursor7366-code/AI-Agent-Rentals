# Persistent Memory Options

Comparing tools to make my memory actually persist across sessions.

---

## Current Setup (File-Based)

**How it works:**
- `MEMORY.md` — curated long-term memory (manual)
- `memory/YYYY-MM-DD.md` — daily logs
- Workspace files loaded each session

**Pros:** Simple, no dependencies, full control
**Cons:** Manual, I might forget to write things, no semantic search

---

## Option 1: Ensue Memory Network

**What it is:** Cloud-based knowledge tree that persists across Claude Code sessions

**Install:**
```bash
# In Claude Code
/plugin marketplace add https://github.com/mutable-state-inc/ensue-skill
/plugin install ensue-memory
# Restart Claude Code
```

**Config:**
- Get API key at https://www.ensue-network.ai/dashboard
- Set `ENSUE_API_KEY` env var
- Optional: `ENSUE_READONLY=true` to disable auto-logging

**Usage:**
```
"remember my preferred stack is React + Postgres"
"what do I know about caching strategies?"
"check my research/distributed-systems/ notes"
```

**Pros:**
- Automatic persistence
- Semantic search ("what do I know about X?")
- Research agent builds knowledge trees
- Clean API

**Cons:**
- Cloud-based (data leaves your machine)
- Requires API key / account
- Dependency on external service

**Best for:** Deep research, building compounding knowledge over time

---

## Option 2: claude-mem

**What it is:** Local compression system that captures session history and injects relevant context

**Install:**
```bash
npm install -g claude-mem
# Or clone and build
git clone https://github.com/thedotmack/claude-mem
cd claude-mem && npm install && npm run build
```

**How it works:**
- Captures what happened in sessions
- Compresses history intelligently
- Injects relevant context into future sessions
- Local storage (SQLite or files)

**Pros:**
- Runs locally (privacy)
- Automatic compression
- No cloud dependency
- MCP integration

**Cons:**
- More complex setup
- Has a crypto token attached (⚠️ potential rug risk)
- Heavier dependency

**Best for:** Privacy-focused, local-first setups

---

## Option 3: Hybrid (Recommended)

Use **file-based** as the foundation + **Ensue** for semantic search:

1. Keep writing to `MEMORY.md` and daily files (human-readable backup)
2. Add Ensue for "what do I know about X?" queries
3. Weekly consolidation task keeps files clean
4. If Ensue goes down, files still work

**Setup:**
1. Install Ensue plugin
2. Keep current file structure
3. Ensue auto-captures, files are manual backup
4. Best of both worlds

---

## Decision

**To test first:** Ensue (cleaner, less setup)

**Action items:**
- [ ] Create Ensue account, get API key
- [ ] Install plugin on host (not sandbox)
- [ ] Test with a few "remember X" commands
- [ ] Evaluate after 1 week

---

## Notes

- claude-mem has a $CMEM token — be aware this is a crypto project, not just a tool
- Ensue is more focused on the actual memory problem
- Both are relatively new — expect rough edges
- File-based backup is always smart regardless of which tool we pick
