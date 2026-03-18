-- Subscriptions table for Stripe billing state
-- Run this in Supabase SQL Editor before enabling billing

create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'trialing' check (status in ('trialing', 'active', 'canceled', 'past_due', 'incomplete')),
  tier text default 'pro_trial' check (tier in ('free', 'pro_trial', 'pro', 'team')),
  billing_cycle text check (billing_cycle in ('monthly', 'annual')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz default (now() + interval '14 days'),
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Index for fast lookups
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);

-- RLS: users can only read their own subscription
alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Service role can do everything (for webhook updates)
create policy "Service role full access"
  on subscriptions for all
  using (true)
  with check (true);

-- Auto-create subscription record on signup
create or replace function create_subscription_on_signup()
returns trigger as $$
begin
  insert into subscriptions (user_id, status, tier, trial_end)
  values (new.id, 'trialing', 'pro_trial', now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function create_subscription_on_signup();
