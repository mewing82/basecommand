-- ============================================================================
-- BaseCommand Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- ─── Accounts ────────────────────────────────────────────────────────────────
CREATE TABLE renewal_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  arr DECIMAL(15,2) DEFAULT 0,
  renewal_date DATE,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  contacts JSONB DEFAULT '[]',
  summary TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE renewal_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own accounts"
  ON renewal_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_accounts_user ON renewal_accounts(user_id);
CREATE INDEX idx_accounts_renewal_date ON renewal_accounts(renewal_date);

-- ─── Context Items (per account) ─────────────────────────────────────────────
CREATE TABLE context_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id TEXT REFERENCES renewal_accounts(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('csv', 'text', 'image')) DEFAULT 'text',
  label TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  content TEXT,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE context_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own context items"
  ON context_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_context_account ON context_items(account_id);

-- ─── Conversation Threads (per account) ──────────────────────────────────────
CREATE TABLE conversation_threads (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id TEXT REFERENCES renewal_accounts(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Thread',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own threads"
  ON conversation_threads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_threads_account ON conversation_threads(account_id);

-- ─── Conversation Messages (per thread) ──────────────────────────────────────
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  thread_id TEXT REFERENCES conversation_threads(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  is_error BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own messages"
  ON conversation_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_messages_thread ON conversation_messages(thread_id);

-- ─── Task Items ──────────────────────────────────────────────────────────────
CREATE TABLE task_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('account', 'strategic')) DEFAULT 'account',
  account_id TEXT REFERENCES renewal_accounts(id) ON DELETE SET NULL,
  account_name TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'complete')) DEFAULT 'pending',
  due_date DATE,
  recurrence TEXT DEFAULT 'none',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  ai_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own tasks"
  ON task_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_tasks_user ON task_items(user_id);

-- ─── Autopilot Actions ───────────────────────────────────────────────────────
CREATE TABLE autopilot_actions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id TEXT REFERENCES renewal_accounts(id) ON DELETE SET NULL,
  account_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email_draft', 'risk_assessment', 'next_action')),
  title TEXT NOT NULL,
  description TEXT,
  draft TEXT,
  urgency TEXT CHECK (urgency IN ('critical', 'high', 'medium')) DEFAULT 'medium',
  reasoning TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE autopilot_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own autopilot actions"
  ON autopilot_actions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_autopilot_user ON autopilot_actions(user_id);

-- ─── Knowledge Base Documents ────────────────────────────────────────────────
CREATE TABLE kb_documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own kb docs"
  ON kb_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Analysis Cache (expansion, leadership, forecast) ────────────────────────
CREATE TABLE analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('expansion', 'leadership', 'forecast', 'autopilot')) NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own cache"
  ON analysis_cache FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── User Settings ───────────────────────────────────────────────────────────
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT,
  ai_provider TEXT DEFAULT 'anthropic',
  ai_model TEXT,
  byok_anthropic TEXT,
  byok_openai TEXT,
  dismissed_suggestions TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── AI Usage Tracking ───────────────────────────────────────────────────────
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,                -- '2026-03' format (year-month)
  call_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own usage"
  ON ai_usage FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_usage_user_period ON ai_usage(user_id, period);

-- ─── Renewal Metrics ─────────────────────────────────────────────────────────
CREATE TABLE renewal_metrics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  metrics JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE renewal_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own metrics"
  ON renewal_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
