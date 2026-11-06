alter table public.orders add column if not exists deleted_at timestamptz;
alter table public.payment_records add column if not exists deleted_at timestamptz;

-- Keep transaction history for reconciliation while removing deleted orders
-- from the portal. Repeated PayPal webhooks must not bring them back.
create or replace function public.delete_admin_order(p_kind text, p_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_order_id text;
  v_payment_id uuid;
  v_deleted_at timestamptz := now();
begin
  if p_kind not in ('order', 'payment') or p_id is null or trim(p_id) = '' then
    raise exception 'Invalid order details' using errcode = '22023';
  end if;
  if p_kind = 'order' then
    select id into v_order_id from public.orders where id = p_id for update;
    if not found then raise exception 'Order not found' using errcode = 'P0002'; end if;
  else
    select id, order_id into v_payment_id, v_order_id
      from public.payment_records where id::text = p_id;
    if not found then raise exception 'Payment not found' using errcode = 'P0002'; end if;
    perform id from public.orders where id = v_order_id for update;
  end if;
  update public.orders set deleted_at = coalesce(deleted_at, v_deleted_at) where id = v_order_id;
  update public.payment_records set deleted_at = coalesce(deleted_at, v_deleted_at)
    where order_id = v_order_id or id = v_payment_id;
  return jsonb_build_object('id', p_id, 'deleted', true);
end;
$$;
revoke all on function public.delete_admin_order(text, text) from public, anon, authenticated;
grant execute on function public.delete_admin_order(text, text) to service_role;
