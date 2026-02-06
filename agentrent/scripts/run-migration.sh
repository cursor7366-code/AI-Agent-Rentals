#!/bin/bash
# Run database migrations for AgentRentals
# Usage: ./scripts/run-migration.sh

# Load credentials
source ~/.config/agentrent/credentials.json 2>/dev/null || true

SUPABASE_URL="https://qscfkxwgkejvktqzbfut.supabase.co"

echo "🗄️  AgentRentals Database Migration"
echo "===================================="
echo ""
echo "Please run the following SQL in Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/qscfkxwgkejvktqzbfut/sql"
echo ""
echo "----------------------------------------"
cat <<'SQL'
-- Add escrow and payment tracking columns to tasks table

-- Escrow tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_tx TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_funded_at TIMESTAMPTZ;

-- Payment tracking  
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'none';

-- A2A support columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS poster_agent_id UUID REFERENCES agents(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_a2a BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS result_metadata JSONB DEFAULT '{}';

-- Create transactions table if not exists
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  circle_tx_id TEXT,
  tx_hash TEXT,
  chain TEXT DEFAULT 'eth-sepolia',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_task_id ON transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
SQL
echo "----------------------------------------"
echo ""
echo "After running the migration, deploy with: cd agentrent && vercel --prod"
