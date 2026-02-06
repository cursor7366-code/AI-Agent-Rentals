# Daily Discovery Scan — Task Definition

> This file defines the task for the daily cron job.

## Task

```
You are running the daily AI tool discovery scan for a trading AI project.

PART 1: NEW DISCOVERIES (~10 items)

1. READ the config at al-brooks-copilot/DISCOVERY_CONFIG.md for:
   - Search keywords
   - Sources to check
   - Current bottlenecks (these determine priority)
   - System modules (map each discovery to a module)

2. SEARCH these sources (pick 2-3 per day, rotate through all weekly):
   - GitHub: trending Python/ML repos, search keywords, watch-list orgs
   - HuggingFace: trending models and spaces
   - Web: recent articles about AI tools, LLM frameworks, trading ML

3. For each interesting find, DETERMINE THE TYPE:

   **TYPE A: Tool** (individual component)
   - Which MODULE does it help? (Pattern Detection, Retrieval, Regime Inference, etc.)
   - What TIME HORIZON? (NOW, SHORT, MEDIUM, LONG)
   - Plain English: how does it help THIS project specifically?
   - Maturity (stars, commits, issues)?
   - Integration effort?
   
   **TYPE B: Framework** (whole system architecture)
   - Does it solve MULTIPLE problems at once?
   - What's the migration cost? (days, weeks, months?)
   - What dependencies does it add?
   - Can we adopt incrementally?
   - Is it backed by a real org with resources?
   - Plain English: how could it change the overall architecture?

4. CATEGORIZE:

   **For Tools:**
   - NOW: Solves current bottleneck, ready this week
   - SHORT: Good fit, needs 2-4 weeks research
   - MEDIUM: Roadmap item, 1-3 months out
   - LONG/WATCHING: Too early, check back later
   - REJECT: Doesn't fit, document reason

   **For Frameworks:**
   - EVALUATING: Reading docs, assessing fit
   - POC: Worth building a proof of concept
   - PAUSED: Good idea but not right time
   - REJECT: Doesn't fit (document why)

PART 2: RADAR MONITORING (2-3 existing tools)

5. CHECK existing tools on TECH_RADAR.md for updates:
   - Pick 2-3 tools (prioritize NOW items, then items near their "Check Back" date)
   - Check GitHub for: new releases, star changes, recent commits, new features
   - Note any significant changes

6. EVALUATE if priority should change:
   - ⬆️ BUMP UP if: major release, better docs, solves more problems, growing fast
   - ⬇️ BUMP DOWN if: abandoned (60+ days no commits), breaking changes, replaced by better option
   - ➡️ NO CHANGE if: stable, no significant updates

PART 3: SYNTHESIS & ANALYSIS

7. THINK DEEPER about each discovery:

   **For each tool, answer:**
   - How would I actually USE this in the project? (concrete scenario)
   - What problem does it solve that we're currently hacking around?
   - What's the "before vs after" — how does the system change?
   - Is this a replacement or an addition to current stack?
   
   **Combinations — look for synergies:**
   - Which tools on the radar work well TOGETHER?
   - Example: "Tool X for embedding + Tool Y for reranking = faster retrieval"
   - Note complementary tools, even if they're not both new today
   - Flag tools that CONFLICT (can't use both, pick one)
   
   **Theories & speculation:**
   - What architectural patterns are emerging? (e.g., "everyone's moving to X")
   - Any paradigm shifts happening? (new approaches to old problems)
   - What could we BUILD by combining 2-3 tools that nobody's built yet?
   - What bets are worth making? ("If X matures, it could replace our entire Y")

PART 4: WRITE OUTPUTS

8. WRITE daily report to: al-brooks-copilot/discovery/YYYY-MM-DD.md
   - New discoveries section
   - Radar updates section (what existing tools were checked, any changes)
   - **Synthesis section** (combinations, theories, architectural thoughts)
   - Recommendations

10. UPDATE al-brooks-copilot/TECH_RADAR.md:
    - Add new discoveries to appropriate time horizon
    - Update "Last Checked" dates for monitored tools
    - Update star counts if changed significantly
    - Move items between sections if priority changed
    - Update "Last Updated" timestamp

11. If anything is NOW priority or got BUMPED UP, mention it prominently.

REMEMBER:
- Generic search queries only (no project details in searches)
- Quality over quantity (~10 new finds, not 50)
- Map everything to a MODULE and TIME HORIZON
- Plain English explanations of how it helps THIS project
- Check if something was already on radar before adding as new
- **GO DEEPER**: Don't just list tools — explain how you'd USE them
- **CONNECT THE DOTS**: Look for combinations and synergies across tools
- **SPECULATE**: Share theories about where things are heading, what bets to make
- The synthesis section is the most valuable part — that's where insight lives
```

## Cron Schedule

Recommended: Daily at 6:00 AM UTC (before US market hours)

```
cron: "0 6 * * *"
```

## Sample Output

See `discovery/TEMPLATE.md` for report format.
