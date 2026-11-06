alter table public.orders
  add column if not exists paypal_order_id text,
  add column if not exists payment_status text not null default 'COMPLETED',
  add column if not exists paid_at timestamptz;

alter table public.orders
  drop constraint if exists orders_payment_status_check,
  add constraint orders_payment_status_check
    check (payment_status in ('PENDING', 'COMPLETED', 'FREE', 'CANCELLED', 'FAILED'));

create unique index if not exists orders_paypal_order_id_idx
  on public.orders (paypal_order_id)
  where paypal_order_id is not null;

revoke insert on public.orders from anon;
revoke insert (id, story_type, page_length, customer_name, customer_email, request, amount, seed_count, page_count, book_title)
  on public.orders from anon;
grant all on table public.orders to service_role;
grant all on table public.payment_records to service_role;

comment on column public.orders.payment_status is 'PayPal checkout state; legacy saved orders are treated as completed.';
comment on column public.orders.paypal_order_id is 'PayPal Orders v2 identifier associated with this website order.';
