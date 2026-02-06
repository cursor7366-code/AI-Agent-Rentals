# HEARTBEAT.md

> **Heartbeat runs hourly, but tasks have different frequencies.**
> Check `memory/heartbeat-state.json` for last run times.
> If nothing needs attention → reply HEARTBEAT_OK

| Task | Frequency | Skip If |
|------|-----------|---------|
| AgentRentals Check | 2x/day | <6 hours since last |
| Discovery Scan | 1x/day | Today's report exists |
| Radar Monitoring | 2-3x/week | <2 days since last check |
| Memory Consolidation | 1x/week | <7 days since last consolidation |

---

## Part 0: AgentRentals Autonomous Operations

**Frequency:** 2x/day (morning + evening)

**Skip if:** `memory/heartbeat-state.json` shows agentrentals check <6 hours ago

### Quick Health Check
```bash
bash ~/clawd/agentrent/scripts/check-status.sh
```

### Work Through TODO
1. Read `agentrent/TODO.md`
2. Do all 🤖 items I can handle without human input
3. If 👤 items are blocking, ping the human ONCE (not every heartbeat)
4. Update TODO.md with progress

### Proactive Tasks (Do Without Asking)
- **Site down?** → Check Vercel logs, attempt redeploy if needed
- **New agent registered?** → Welcome them, add to daily notes
- **Task completed?** → Log it, update stats
- **Moltbook responses?** → Check DMs, respond to interested agents

### Supabase Direct Access
```bash
# Query agents
curl -s "https://qscfkxwgkejvktqzbfut.supabase.co/rest/v1/agents?select=*" \
  -H "apikey: $(grep SUPABASE_ANON_KEY ~/clawd/agentrent/.env.credentials | cut -d= -f2)" \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY ~/clawd/agentrent/.env.credentials | cut -d= -f2)"

# Query tasks  
curl -s "https://qscfkxwgkejvktqzbfut.supabase.co/rest/v1/tasks?select=*" \
  -H "apikey: $(grep SUPABASE_ANON_KEY ~/clawd/agentrent/.env.credentials | cut -d= -f2)" \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY ~/clawd/agentrent/.env.credentials | cut -d= -f2)"

# Insert (use service role key for writes)
# POST to /rest/v1/TABLE_NAME with JSON body
```

### After Check
- Update `memory/heartbeat-state.json` with timestamp
- If something significant happened → add to daily memory file
- If human action needed → mention it (but don't nag)

---

## Part 1: Daily Discovery Scan (AI Tools for Trading Project)

**Frequency:** Once per day (morning preferred)

**Quick check:** If `al-brooks-copilot/discovery/YYYY-MM-DD.md` exists for today → skip entirely, move to Part 2.

**If report does NOT exist for today:**
1. Read `al-brooks-copilot/DISCOVERY_CONFIG.md` for search parameters
2. Read `al-brooks-copilot/DAILY_SCAN_TASK.md` for full task instructions
3. Search GitHub, HuggingFace for ~10 high-signal tools
4. Evaluate each against the project's actual bottlenecks (pattern detection, retrieval, regime inference, vision)
5. Write report to `al-brooks-copilot/discovery/YYYY-MM-DD.md`
6. Update `al-brooks-copilot/TECH_RADAR.md` with new items
7. **Send email summary** using Resend API (config in `al-brooks-copilot/.email-config.json`)
8. If anything is HIGH priority, mention it when reporting back

**If report DOES exist for today:**
- Skip the scan (already done)
- Continue to Part 2 (Radar Monitoring)

## Email Sending (Step 7)

Use this curl command to send the daily report email:
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer API_KEY_FROM_CONFIG' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Tech Radar <onboarding@resend.dev>",
    "to": ["hollywood736@gmail.com"],
    "subject": "🔍 Tech Radar - YYYY-MM-DD",
    "text": "REPORT_SUMMARY_HERE"
  }'
```

## Rules
- Keep to ~10 items per day (quality over quantity)
- Plain English explanations of how each tool helps the specific project
- No project details in search queries (confidentiality)
- Prefer consolidated tools that solve multiple problems

---

## Part 2: Radar Monitoring (Check Existing Tools)

**Frequency:** 2-3x per week (not every heartbeat)

**Skip if:** Last radar check was <2 days ago (check `memory/heartbeat-state.json`)

When running, check 2-3 tools already on the radar for updates:

**What to check:**
- New releases or version bumps
- Star count changes (momentum indicator)
- New features added
- Documentation improvements
- Breaking changes or deprecations
- Community activity (issues, PRs, discussions)

**Priority for monitoring:**
1. **NOW items** — check every scan (these we're about to use)
2. **SHORT items** — check 2x/week
3. **WATCHING items** — check when their "Check Back" date arrives

**If update found:**
- Note in daily report under "## Radar Updates"
- Update TECH_RADAR.md with new info
- Bump priority if update makes tool more useful
- Add warning if update breaks compatibility or tool is abandoned

**Signs to bump UP priority:**
- Major release with features we need
- Significant star growth (real adoption)
- New documentation/tutorials
- Integration with tools we use

**Signs to bump DOWN or REJECT:**
- No commits in 60+ days
- Maintainer abandoned
- Breaking changes that hurt our use case
- Replaced by something better

---

## Part 3: Memory Maintenance (Weekly)

**Run on:** Sundays, or when `memory/last-consolidation.txt` is >7 days old

**Check trigger:**
```bash
# If file doesn't exist or is older than 7 days, run maintenance
find memory/last-consolidation.txt -mtime +7 2>/dev/null || echo "RUN_MAINTENANCE"
```

**If maintenance needed:**

1. **Review recent daily files** — Read `memory/YYYY-MM-DD.md` from the past 7 days

2. **Update MEMORY.md** with anything worth keeping long-term:
   - Decisions made and their rationale
   - Lessons learned / mistakes to avoid
   - Project status changes
   - User preferences discovered
   - Useful patterns or workflows

3. **Prune MEMORY.md** — Remove outdated info:
   - Completed tasks that don't matter anymore
   - Superseded decisions
   - Stale context

4. **Update timestamp:**
   ```bash
   date > memory/last-consolidation.txt
   ```

5. **Report back** with what was consolidated (brief summary)

**If no maintenance needed:**
- Skip, continue to HEARTBEAT_OK check

---

## Part 4: Session Memory (Every Session)

**Not a heartbeat task** — just a reminder of what to do each session:

1. Read `memory/YYYY-MM-DD.md` for today + yesterday
2. In main sessions, also read `MEMORY.md`
3. Write significant events to today's daily file
4. If something important happens, update MEMORY.md immediately (don't wait for weekly)
