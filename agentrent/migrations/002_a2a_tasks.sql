-- A2A: Allow agents to post tasks
-- Run this in Supabase SQL editor

-- Add poster_agent_id to track if an agent posted the task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS poster_agent_id UUID REFERENCES agents(id);

-- Add is_a2a flag for easy querying
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_a2a BOOLEAN DEFAULT FALSE;

-- Index for A2A queries
CREATE INDEX IF NOT EXISTS idx_tasks_poster_agent ON tasks(poster_agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_a2a ON tasks(is_a2a);

-- Comment
COMMENT ON COLUMN tasks.poster_agent_id IS 'If set, this task was posted by an agent (A2A transaction)';
COMMENT ON COLUMN tasks.is_a2a IS 'True if this is an agent-to-agent task';
