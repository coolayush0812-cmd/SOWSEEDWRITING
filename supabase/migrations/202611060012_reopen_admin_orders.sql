-- Reopen linked fulfillment records without changing payment details.
create or replace function public.reopen_admin_order(p_kind text, p_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_order_id text;
  v_payment_id uuid;
begin
  if p_kind not in ('order', 'payment') or p_id is null or trim(p_id) = '' then
    raise exception 'Invalid order details' using errcode = '22023';
  end if;
  if p_kind = 'order' then
    select id into v_order_id from public.orders where id = p_id and deleted_at is null for update;
    if not found then raise exception 'Order not found' using errcode = 'P0002'; end if;
  else
    select id, order_id into v_payment_id, v_order_id
      from public.payment_records where id::text = p_id and deleted_at is null;
    if not found then raise exception 'Payment not found' using errcode = 'P0002'; end if;
    perform id from public.orders where id = v_order_id for update;
  end if;
  update public.orders set status = 'pending', fulfilled_at = null
    where id = v_order_id and deleted_at is null;
  update public.payment_records set status = 'unfulfilled', fulfilled_at = null
    where (order_id = v_order_id or id = v_payment_id) and deleted_at is null;
  return jsonb_build_object('id', p_id, 'status', 'pending');
end;
$$;
revoke all on function public.reopen_admin_order(text, text) from public, anon, authenticated;
grant execute on function public.reopen_admin_order(text, text) to service_role;
