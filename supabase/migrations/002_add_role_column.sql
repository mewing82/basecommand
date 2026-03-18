-- Add role column to subscriptions table for admin access
-- Run this in Supabase SQL Editor

alter table subscriptions
  add column if not exists role text default 'user'
  check (role in ('user', 'admin'));

-- Set Michael's account as admin (replace with your actual user_id if different)
-- Run this after confirming your user_id:
-- update subscriptions set role = 'admin' where user_id = 'YOUR_USER_ID_HERE';
