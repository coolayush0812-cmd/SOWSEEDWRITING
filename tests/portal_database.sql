-- Executes only temporary fixtures inside one rolled-back transaction.
begin;
do $$
declare
  v_order_id text := 'SG-20991231-TST9';
  v_pending_id text := 'SG-20991231-TST8';
  v_paid_at timestamptz := now() - interval '1 hour';
  v_fulfilled_at timestamptz := now() - interval '30 minutes';
  v_record jsonb;
begin
  insert into public.orders (
    id, created_at, story_type, page_length, page_count, customer_name,
    customer_email, request, amount, seed_count, payment_status, paypal_order_id
  ) values (
    v_order_id, now() - interval '2 hours', 'Personal Request', '10 pages', 10,
    'Temporary regression fixture', 'test@example.com', 'Transaction-only verification',
    11, null, 'PENDING', 'TEST-PAYPAL-ATOMIC-001'
  ), (
    v_pending_id, now() - interval '2 hours', 'Personal Request', '10 pages', 10,
    'Temporary unpaid fixture', 'test@example.com', 'Transaction-only verification',
    11, null, 'PENDING', null
  );
  v_record := jsonb_build_object(
    'provider_order_id', 'TEST-PAYPAL-ATOMIC-001', 'transaction_id', 'TEST-CAPTURE-ATOMIC-001',
    'source_event_id', 'TEST-EVENT-ATOMIC-001', 'order_id', v_order_id,
    'customer_name', 'Test Reader', 'contact_email', 'test@example.com',
    'buyer_email', 'payer@example.com', 'item_name', 'Personalised Digital Writing - Custom Order Made Writing',
    'amount', 11, 'currency', 'USD', 'paid_at', v_paid_at, 'payment_status', 'COMPLETED'
  );
  perform public.record_paypal_capture(v_record);
  perform public.record_paypal_capture(v_record || jsonb_build_object('source_event_id', 'TEST-EVENT-ATOMIC-002'));
  if (select count(*) from public.payment_records where transaction_id = 'TEST-CAPTURE-ATOMIC-001') <> 1
     or not exists(select 1 from public.orders where id = v_order_id and payment_status = 'COMPLETED' and paid_at = v_paid_at) then
    raise exception 'Capture retry did not produce one confirmed order and payment';
  end if;

  begin
    perform public.record_paypal_capture(v_record || jsonb_build_object('amount', 22, 'transaction_id', 'TEST-MISMATCH', 'source_event_id', 'TEST-MISMATCH'));
    raise exception 'Mismatched capture was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.fulfill_admin_order('order', v_order_id, v_paid_at - interval '1 minute');
    raise exception 'Fulfillment before payment was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.fulfill_admin_order('order', v_pending_id, v_fulfilled_at);
    raise exception 'Unpaid order was fulfilled';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.fulfill_admin_order('order', v_order_id, now() + interval '1 day');
    raise exception 'Future fulfillment was accepted';
  exception when invalid_parameter_value then null;
  end;

  perform public.fulfill_admin_order('order', v_order_id, v_fulfilled_at);
  perform public.fulfill_admin_order('payment', (select id::text from public.payment_records where order_id = v_order_id), now() - interval '20 minutes');
  perform public.record_paypal_capture(v_record);
  if not exists(select 1 from public.orders where id = v_order_id and status = 'fulfilled' and fulfilled_at = v_fulfilled_at)
     or not exists(select 1 from public.payment_records where order_id = v_order_id and status = 'fulfilled' and fulfilled_at = v_fulfilled_at) then
    raise exception 'Order and payment fulfillment diverged';
  end if;
  if has_function_privilege('anon', 'public.record_paypal_capture(jsonb)', 'execute')
     or has_function_privilege('authenticated', 'public.fulfill_admin_order(text,text,timestamptz)', 'execute')
     or has_column_privilege('anon', 'public.orders', 'id', 'insert') then
    raise exception 'Private order writes are exposed to browser roles';
  end if;
  raise notice 'PASS: atomic capture, duplicate delivery, amount verification, fulfillment dates, and private writes';
end;
$$;
rollback;
