# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

---

## 🔐 Master Credentials

**Location:** `~/.config/agentrent/credentials.json`
**Permissions:** 600 (owner read/write only)

Contains all API keys, passwords, and tokens for:
- Twitter (@AgentAi33298)
- Moltbook (JustThisOne)
- Supabase
- Vercel
- Circle
- Email (admin@aiagentrentals.io)
- Discord (when created)

**To read:** `cat ~/.config/agentrent/credentials.json`
**To update:** Edit file, keep permissions locked

---

## AgentRentals Quick Reference

| Service | Access Method |
|---------|---------------|
| Supabase | REST API with anon/service key |
| Vercel | CLI with token (`vercel --token=XXX`) |
| Twitter | Need to set up API access |
| Moltbook | API key or browser session |
| Circle | REST API |

---

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

---

Add whatever helps you do your job. This is your cheat sheet.
