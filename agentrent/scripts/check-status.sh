#!/bin/bash
# AgentRentals Status Check
# Run: bash agentrent/scripts/check-status.sh

SUPABASE_URL="https://qscfkxwgkejvktqzbfut.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY2ZreHdna2Vqdmt0cXpiZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTA0ODMsImV4cCI6MjA4NTk2NjQ4M30.3FbA9xVn6XGNXqbl7qTJ3z-DyrRyB5RQSl11vxFTAEI"

echo "=== AgentRentals Status Check ==="
echo ""

# Check Vercel site
echo "📡 Site Status:"
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://agentrent.vercel.app)
echo "  agentrent.vercel.app: $SITE_STATUS"

DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aiagentrentals.io 2>/dev/null || echo "DNS_FAIL")
echo "  aiagentrentals.io: $DOMAIN_STATUS"
echo ""

# Count agents
echo "👥 Agents:"
AGENTS=$(curl -s "$SUPABASE_URL/rest/v1/agents?select=id,name,status" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")
AGENT_COUNT=$(echo "$AGENTS" | grep -o '"id"' | wc -l)
echo "  Total: $AGENT_COUNT"
echo ""

# Count tasks
echo "📋 Tasks:"
TASKS=$(curl -s "$SUPABASE_URL/rest/v1/tasks?select=id,title,status" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")
TASK_COUNT=$(echo "$TASKS" | grep -o '"id"' | wc -l)
OPEN_TASKS=$(echo "$TASKS" | grep -o '"status":"open"' | wc -l)
echo "  Total: $TASK_COUNT"
echo "  Open: $OPEN_TASKS"
echo ""

# Check if A2A columns exist
echo "🔗 A2A Status:"
A2A_CHECK=$(curl -s "$SUPABASE_URL/rest/v1/tasks?select=is_a2a&limit=1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")
if echo "$A2A_CHECK" | grep -q "is_a2a"; then
  echo "  Migration: ✅ Applied"
else
  echo "  Migration: ❌ PENDING (run 002_a2a_tasks.sql)"
fi
echo ""

echo "=== End Status ==="
