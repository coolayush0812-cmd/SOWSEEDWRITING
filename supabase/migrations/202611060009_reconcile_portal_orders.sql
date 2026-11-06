alter table public.orders
  drop constraint if exists orders_payment_status_check,
  add constraint orders_payment_status_check
    check (payment_status in ('PENDING', 'COMPLETED', 'FREE', 'CANCELLED', 'FAILED', 'UNVERIFIED')),
  alter column payment_status set default 'PENDING';

-- Orders submitted before checkout existed are orders, not proof of payment.
update public.orders
set payment_status = case when amount = 0 then 'FREE' else 'UNVERIFIED' end
where paypal_order_id is null
  and not exists (
    select 1 from public.payment_records p
    where p.order_id = orders.id and p.payment_status = 'COMPLETED'
  );

create or replace function public.fulfill_admin_order(
  p_kind text,
  p_id text,
  p_fulfilled_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payment_records%rowtype;
  v_order_id text;
  v_earliest timestamptz;
begin
  if p_kind not in ('order', 'payment') or p_id is null or p_id = ''
     or p_fulfilled_at is null or p_fulfilled_at > now() then
    raise exception 'Invalid fulfillment details' using errcode = '22023';
  end if;

  if p_kind = 'order' then
    v_order_id := p_id;
  else
    select * into v_payment from public.payment_records where id::text = p_id;
    if not found or v_payment.payment_status <> 'COMPLETED' then
      raise exception 'A completed payment is required' using errcode = '22023';
    end if;
    v_order_id := v_payment.order_id;
  end if;

  -- Lock the order first for both entry points to keep linked records consistent.
  select * into v_order from public.orders where id = v_order_id for update;
  if found then
    if v_order.payment_status not in ('COMPLETED', 'FREE', 'UNVERIFIED') then
      raise exception 'This order is awaiting payment' using errcode = '22023';
    end if;
    v_earliest := greatest(v_order.created_at, v_order.paid_at);
    select greatest(v_earliest, max(paid_at)) into v_earliest
      from public.payment_records
      where order_id = v_order.id and payment_status = 'COMPLETED';
  elsif p_kind = 'order' then
    raise exception 'Order not found' using errcode = 'P0002';
  else
    v_earliest := v_payment.paid_at;
  end if;

  if p_fulfilled_at < v_earliest then
    raise exception 'Fulfillment must be after the order and its payment' using errcode = '22023';
  end if;

  if v_order.id is not null then
    update public.orders set status = 'fulfilled', fulfilled_at = p_fulfilled_at
      where id = v_order.id and status <> 'fulfilled';
    update public.payment_records
      set status = 'fulfilled', fulfilled_at = coalesce(v_order.fulfilled_at, p_fulfilled_at)
      where order_id = v_order.id and payment_status = 'COMPLETED' and status <> 'fulfilled';
  else
    update public.payment_records set status = 'fulfilled', fulfilled_at = p_fulfilled_at
      where id = v_payment.id and payment_status = 'COMPLETED' and status <> 'fulfilled';
  end if;

  return jsonb_build_object('kind', p_kind, 'id', p_id, 'status', 'fulfilled');
end;
$$;

revoke all on function public.fulfill_admin_order(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.fulfill_admin_order(text, text, timestamptz) to service_role;

comment on function public.fulfill_admin_order(text, text, timestamptz)
  is 'Atomically fulfills an order and its verified PayPal payment after shared-password admin authentication.';
