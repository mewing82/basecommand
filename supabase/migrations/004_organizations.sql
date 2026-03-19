-- ============================================================================
-- BaseCommand Organizations — Team Model (Phase 1)
-- Adds org/team layer. Safe to re-run: uses IF NOT EXISTS for all objects.
-- ============================================================================

-- ─── Organizations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Organization',
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ─── Org Members ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);

-- ─── Org Invites (Phase 2 schema, created now) ─────────────────────────────
CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'manager', 'member')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email);

-- ─── RLS helper: returns all org IDs for the current user ───────────────────
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(array_agg(org_id), '{}'::UUID[])
  FROM org_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── RLS Policies for org tables ────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "Members can view their orgs"
    ON organizations FOR SELECT USING (id = ANY(user_org_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can update their orgs"
    ON organizations FOR UPDATE USING (id = ANY(user_org_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create orgs"
    ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Members can view org members"
    ON org_members FOR SELECT USING (org_id = ANY(user_org_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage org members"
    ON org_members FOR ALL USING (org_id = ANY(user_org_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Members can view org invites"
    ON org_invites FOR SELECT USING (org_id = ANY(user_org_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Add org_id + assigned_to to existing data tables ───────────────────────

-- renewal_accounts
ALTER TABLE renewal_accounts ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE renewal_accounts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_org ON renewal_accounts(org_id);

-- context_items
ALTER TABLE context_items ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_context_org ON context_items(org_id);

-- conversation_threads
ALTER TABLE conversation_threads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_threads_org ON conversation_threads(org_id);

-- conversation_messages
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_org ON conversation_messages(org_id);

-- task_items
ALTER TABLE task_items ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE task_items ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_org ON task_items(org_id);

-- autopilot_actions
ALTER TABLE autopilot_actions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE autopilot_actions ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_autopilot_org ON autopilot_actions(org_id);

-- kb_documents
ALTER TABLE kb_documents ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_kb_org ON kb_documents(org_id);

-- analysis_cache
ALTER TABLE analysis_cache ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_analysis_org ON analysis_cache(org_id);

-- renewal_metrics
ALTER TABLE renewal_metrics ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_metrics_org ON renewal_metrics(org_id);

-- subscriptions (billing moves to org)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS founding_member BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);

-- ─── Update RLS policies: org-scoped access ─────────────────────────────────
-- Drop old user_id-only policies and create org-scoped ones

-- renewal_accounts
DROP POLICY IF EXISTS "Users can only access their own accounts" ON renewal_accounts;
DO $$ BEGIN
  CREATE POLICY "Org members can access accounts"
    ON renewal_accounts FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- context_items
DROP POLICY IF EXISTS "Users can only access their own context items" ON context_items;
DO $$ BEGIN
  CREATE POLICY "Org members can access context items"
    ON context_items FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- conversation_threads
DROP POLICY IF EXISTS "Users can only access their own threads" ON conversation_threads;
DO $$ BEGIN
  CREATE POLICY "Org members can access threads"
    ON conversation_threads FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- conversation_messages
DROP POLICY IF EXISTS "Users can only access their own messages" ON conversation_messages;
DO $$ BEGIN
  CREATE POLICY "Org members can access messages"
    ON conversation_messages FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- task_items
DROP POLICY IF EXISTS "Users can only access their own tasks" ON task_items;
DO $$ BEGIN
  CREATE POLICY "Org members can access tasks"
    ON task_items FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- autopilot_actions
DROP POLICY IF EXISTS "Users can only access their own autopilot actions" ON autopilot_actions;
DO $$ BEGIN
  CREATE POLICY "Org members can access autopilot actions"
    ON autopilot_actions FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- kb_documents
DROP POLICY IF EXISTS "Users can only access their own kb docs" ON kb_documents;
DO $$ BEGIN
  CREATE POLICY "Org members can access kb docs"
    ON kb_documents FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- analysis_cache
DROP POLICY IF EXISTS "Users can only access their own cache" ON analysis_cache;
DO $$ BEGIN
  CREATE POLICY "Org members can access cache"
    ON analysis_cache FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- renewal_metrics
DROP POLICY IF EXISTS "Users can only access their own metrics" ON renewal_metrics;
DO $$ BEGIN
  CREATE POLICY "Org members can access metrics"
    ON renewal_metrics FOR ALL
    USING (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id))
    WITH CHECK (org_id = ANY(user_org_ids()) OR (org_id IS NULL AND auth.uid() = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Auto-create org on signup ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user_org()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a personal org for the new user
  INSERT INTO organizations (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '''s Organization',
    NEW.id
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-run
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_org();

-- ─── Backfill: create orgs for existing users ──────────────────────────────
DO $$
DECLARE
  u RECORD;
  new_org_id UUID;
BEGIN
  FOR u IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM org_members)
  LOOP
    INSERT INTO organizations (name, owner_id)
    VALUES (
      COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) || '''s Organization',
      u.id
    )
    RETURNING id INTO new_org_id;

    INSERT INTO org_members (org_id, user_id, role)
    VALUES (new_org_id, u.id, 'owner');

    -- Backfill org_id on all data tables for this user
    UPDATE renewal_accounts SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE context_items SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE conversation_threads SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE conversation_messages SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE task_items SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE autopilot_actions SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE kb_documents SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE analysis_cache SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE renewal_metrics SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
    UPDATE subscriptions SET org_id = new_org_id WHERE user_id = u.id AND org_id IS NULL;
  END LOOP;
END $$;

-- ─── Update analysis_cache unique constraint for org scope ──────────────────
-- Old: UNIQUE(user_id, type) — New: UNIQUE(org_id, type)
-- We keep the old constraint for backward compat until all data has org_id
ALTER TABLE analysis_cache DROP CONSTRAINT IF EXISTS analysis_cache_user_id_type_key;
DO $$ BEGIN
  ALTER TABLE analysis_cache ADD CONSTRAINT analysis_cache_org_type_key UNIQUE (org_id, type);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
