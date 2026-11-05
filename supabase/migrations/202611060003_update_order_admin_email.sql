drop policy if exists "Admin can read orders" on public.orders;
create policy "Admin can read orders"
  on public.orders for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sowseed@gmail.com');

drop policy if exists "Admin can fulfill orders" on public.orders;
create policy "Admin can fulfill orders"
  on public.orders for update to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sowseed@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sowseed@gmail.com');
