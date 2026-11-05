alter table public.orders
  add column if not exists book_title text;

alter table public.orders
  drop constraint if exists orders_story_type_check,
  drop constraint if exists orders_page_pricing_check,
  drop constraint if exists orders_amount_check;

alter table public.orders
  add constraint orders_story_type_check check (
    story_type in (
      'Personal Request',
      'Faith Based (Prayer / Inspiration)',
      'Motivational',
      'Surprise Me',
      'Book Order'
    )
  ),
  add constraint orders_page_pricing_check check (
    (
      story_type = 'Book Order'
      and page_count is null
      and seed_count is null
      and book_title is not null
      and char_length(trim(book_title)) between 1 and 160
      and page_length = 'Book'
      and amount in (0, 11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121, 132, 143, 154, 165, 176, 187)
    )
    or
    (
      story_type = 'Personal Request'
      and page_count between 10 and 130
      and seed_count is null
      and book_title is null
      and page_length = page_count::text || ' pages'
      and amount = ((page_count::integer - 10) / 11 + 1) * 11
    )
    or
    (
      story_type <> 'Book Order'
      and page_count is null
      and book_title is null
      and seed_count between 1 and 3
      and amount = seed_count * 7
    )
  );

grant insert (book_title) on table public.orders to anon;

comment on column public.orders.book_title is 'Selected library title for manually fulfilled book orders.';
