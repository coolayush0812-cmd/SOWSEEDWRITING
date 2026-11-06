create or replace function public.record_paypal_capture(p_record jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_existing public.payment_records%rowtype;
  v_payment public.payment_records%rowtype;
  v_amount numeric := (p_record ->> 'amount')::numeric;
  v_paid_at timestamptz := (p_record ->> 'paid_at')::timestamptz;
  v_transaction text := nullif(p_record ->> 'transaction_id', '');
  v_provider_order text := nullif(p_record ->> 'provider_order_id', '');
  v_order_id text := nullif(p_record ->> 'order_id', '');
begin
  if v_transaction is null or v_provider_order is null or v_paid_at is null
     or v_amount is null or v_amount <= 0 or v_amount <> round(v_amount, 2)
     or p_record ->> 'currency' is distinct from 'USD'
     or p_record ->> 'payment_status' is distinct from 'COMPLETED'
     or nullif(p_record ->> 'source_event_id', '') is null
     or nullif(p_record ->> 'item_name', '') is null then
    raise exception 'Invalid completed PayPal capture' using errcode = '22023';
  end if;

  select * into v_order from public.orders
    where id = v_order_id or paypal_order_id = v_provider_order
    order by id limit 1 for update;
  if found then
    if v_order.amount <> v_amount
       or (v_order_id is not null and v_order_id <> v_order.id)
       or (v_order.paypal_order_id is not null and v_order.paypal_order_id <> v_provider_order)
       or v_order.payment_status = 'FREE' then
      raise exception 'PayPal capture does not match the website order' using errcode = '22023';
    end if;
    v_order_id := v_order.id;
  end if;

  select * into v_existing from public.payment_records
    where transaction_id = v_transaction for update;
  if found and (v_existing.amount <> v_amount or v_existing.currency <> 'USD'
                or v_existing.provider_order_id is distinct from v_provider_order
                or v_existing.order_id is distinct from v_order_id) then
    raise exception 'PayPal transaction is already attached to a different order' using errcode = '22023';
  end if;

  insert into public.payment_records (
    provider, provider_order_id, transaction_id, source_event_id, order_id,
    customer_name, contact_email, buyer_email, item_name, amount, currency,
    paid_at, payment_status, status, fulfilled_at
  ) values (
    'PayPal', v_provider_order, v_transaction, p_record ->> 'source_event_id', v_order_id,
    coalesce(v_order.customer_name, p_record ->> 'customer_name'),
    coalesce(v_order.customer_email, p_record ->> 'contact_email'),
    p_record ->> 'buyer_email', p_record ->> 'item_name', v_amount, 'USD',
    v_paid_at, 'COMPLETED',
    case when v_order.fulfilled_at >= v_paid_at then 'fulfilled' else 'unfulfilled' end,
    case when v_order.fulfilled_at >= v_paid_at then v_order.fulfilled_at else null end
  ) on conflict (transaction_id) do update set
    customer_name = coalesce(excluded.customer_name, payment_records.customer_name),
    contact_email = coalesce(excluded.contact_email, payment_records.contact_email),
    buyer_email = coalesce(excluded.buyer_email, payment_records.buyer_email)
  returning * into v_payment;

  if v_order.id is not null then
    update public.orders set
      payment_status = 'COMPLETED', paypal_order_id = v_provider_order,
      paid_at = coalesce(paid_at, v_paid_at)
    where id = v_order.id;
  end if;

  return jsonb_build_object('paymentId', v_payment.id, 'orderId', v_order_id, 'status', 'COMPLETED');
end;
$$;

revoke all on function public.record_paypal_capture(jsonb) from public, anon, authenticated;
grant execute on function public.record_paypal_capture(jsonb) to service_role;

comment on function public.record_paypal_capture(jsonb)
  is 'Atomically records a server-verified PayPal capture and confirms its website order; duplicate capture/webhook deliveries are idempotent.';
