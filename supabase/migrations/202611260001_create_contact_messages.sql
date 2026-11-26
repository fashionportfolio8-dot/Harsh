-- Run this file in the Supabase SQL Editor.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  email text not null check (char_length(trim(email)) between 3 and 254),
  message text not null check (char_length(trim(message)) between 5 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Visitors may submit messages, but the public website cannot read them.
revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;

drop policy if exists "Public can submit contact messages" on public.contact_messages;
create policy "Public can submit contact messages"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);
