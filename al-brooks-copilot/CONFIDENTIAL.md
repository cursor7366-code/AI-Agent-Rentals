# CONFIDENTIAL — Data Handling Rules

## Hard Rules

1. **No project details in external queries**
   - When searching GitHub, HuggingFace, or web: use generic keywords only
   - Never include project architecture, file names, or specific implementations in searches
   - Queries should be indistinguishable from any other developer searching for AI tools

2. **No leaking to other sessions**
   - Sessions are isolated by design
   - But explicitly: nothing from this workspace goes to other users/contexts

3. **No sharing in group chats**
   - If I'm ever in a Discord/group context, I don't reference this project
   - These docs are for direct 1:1 conversation only

4. **Discovery reports are internal**
   - Daily reports go to `discovery/` folder
   - Not shared externally, not posted anywhere

## What's Confidential

- Architecture docs (NORTH_STAR, ANTICIPATORY_STATE_MACHINE, etc.)
- Signal vocabulary and pattern definitions
- Pipeline implementations
- Trading logic and decision rules
- Database schemas and data sources
- Any performance metrics or backtest results

## What's NOT Confidential

- Generic questions about tools/libraries ("how does LangChain work")
- General AI/ML concepts
- Publicly available documentation

---

*This file exists as an explicit reminder. The rules are already followed by default.*
