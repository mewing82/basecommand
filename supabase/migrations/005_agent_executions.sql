-- Migration 005: Agent Executions + Autonomy Infrastructure
-- Epic 8: Autonomous Agents — Phase 1 (Supervised Autopilot)

-- ─── New table: agent_executions (audit trail) ──────────────────────────────
CREATE TABLE IF NOT EXISTS agent_executions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id     TEXT NOT NULL DEFAULT 'autopilot',
  action_type  TEXT NOT NULL,                    -- email_draft, risk_assessment, next_action
  action_id    TEXT,                              -- FK to autopilot_actions.id (nullable for direct executions)
  account_id   TEXT,
  account_name TEXT,
  input_summary  TEXT DEFAULT '',
  output_summary TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'generated'  -- generated, pending_approval, approved, executed, dismissed, failed
    CHECK (status IN ('generated','pending_approval','approved','executed','dismissed','failed')),
  executed_at  TIMESTAMPTZ,
  error_message TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_executions_org     ON agent_executions(org_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status  ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent   ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON agent_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_executions_account ON agent_executions(account_id);

-- RLS
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view executions in their org"
  ON agent_executions FOR SELECT
  USING (
    org_id = ANY(user_org_ids())
    OR (org_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can insert executions in their org"
  ON agent_executions FOR INSERT
  WITH CHECK (
    org_id = ANY(user_org_ids())
    OR (org_id IS NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can update executions in their org"
  ON agent_executions FOR UPDATE
  USING (
    org_id = ANY(user_org_ids())
    OR (org_id IS NULL AND auth.uid() = user_id)
  );

-- Service role full access
CREATE POLICY "Service role full access on agent_executions"
  ON agent_executions FOR ALL
  USING (auth.role() = 'service_role');

-- ─── Extend autopilot_actions with agent_id + execution fields ──────────────
ALTER TABLE autopilot_actions
  ADD COLUMN IF NOT EXISTS agent_id TEXT DEFAULT 'autopilot',
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_result JSONB DEFAULT '{}';
