alter table public.orders
  add column if not exists page_count smallint;

alter table public.orders
  alter column seed_count drop not null;

alter table public.orders
  drop constraint if exists orders_amount_check,
  drop constraint if exists orders_seed_count_check,
  drop constraint if exists orders_seed_price_check;

alter table public.orders
  add constraint orders_page_pricing_check check (
    (
      page_count is null
      and seed_count between 1 and 3
      and amount = seed_count * 7
    )
    or
    (
      page_count between 10 and 130
      and seed_count is null
      and page_length = page_count::text || ' pages'
      and amount = ((page_count::integer - 10) / 11 + 1) * 11
    )
  );

grant insert (page_count) on table public.orders to anon;
