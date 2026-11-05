create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'PayPal' constraint payment_records_provider_check check (provider = 'PayPal'),
  provider_order_id text,
  transaction_id text not null unique,
  source_event_id text not null unique,
  order_id text,
  customer_name text,
  contact_email text,
  buyer_email text,
  item_name text not null,
  amount numeric(10, 2) not null constraint payment_records_amount_check check (amount > 0),
  currency text not null default 'USD' constraint payment_records_currency_check check (currency = 'USD'),
  paid_at timestamptz not null,
  payment_status text not null default 'COMPLETED' constraint payment_records_payment_status_check check (payment_status in ('COMPLETED', 'REFUNDED')),
  status text not null default 'unfulfilled' constraint payment_records_status_check check (status in ('unfulfilled', 'fulfilled')),
  fulfilled_at timestamptz,
  constraint payment_records_fulfillment_check check (
    (status = 'unfulfilled' and fulfilled_at is null)
    or (status = 'fulfilled' and fulfilled_at is not null and fulfilled_at >= paid_at)
  )
);

create index if not exists payment_records_paid_at_idx on public.payment_records (paid_at desc);
create index if not exists payment_records_status_idx on public.payment_records (status);

alter table public.payment_records enable row level security;

revoke all on table public.payment_records from anon, authenticated;
grant select on table public.payment_records to authenticated;
grant update (status, fulfilled_at) on table public.payment_records to authenticated;

create policy "Admin can read payment records"
  on public.payment_records for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sowseed@gmail.com');

create policy "Admin can fulfill payment records"
  on public.payment_records for update to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sowseed@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sowseed@gmail.com');

comment on table public.payment_records is 'PayPal captures verified by the server webhook; browser clients cannot insert payment records.';
