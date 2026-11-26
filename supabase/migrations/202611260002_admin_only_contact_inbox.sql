-- Allow only users with an administrator app_metadata role to read enquiries.
grant select on table public.contact_messages to authenticated;

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');