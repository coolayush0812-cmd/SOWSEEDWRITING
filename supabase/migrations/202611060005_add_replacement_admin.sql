drop policy if exists "Admin can read orders" on public.orders;
create policy "Admin can read orders"
  on public.orders for select to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('sowseed@gmail.com', 'coolayush0812@gmail.com')
  );

drop policy if exists "Admin can fulfill orders" on public.orders;
create policy "Admin can fulfill orders"
  on public.orders for update to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('sowseed@gmail.com', 'coolayush0812@gmail.com')
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('sowseed@gmail.com', 'coolayush0812@gmail.com')
  );

drop policy if exists "Admin can read payment records" on public.payment_records;
create policy "Admin can read payment records"
  on public.payment_records for select to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('sowseed@gmail.com', 'coolayush0812@gmail.com')
  );

drop policy if exists "Admin can fulfill payment records" on public.payment_records;
create policy "Admin can fulfill payment records"
  on public.payment_records for update to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('sowseed@gmail.com', 'coolayush0812@gmail.com')
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('sowseed@gmail.com', 'coolayush0812@gmail.com')
  );
