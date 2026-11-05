create table if not exists public.admin_settings (
  id smallint primary key check (id = 1),
  password_salt text not null,
  password_hash text not null,
  changed_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;
revoke all on table public.admin_settings from anon, authenticated;
grant all on table public.admin_settings to service_role;

create table if not exists public.admin_login_attempts (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  failed_attempts integer not null default 0,
  locked_until timestamptz
);

alter table public.admin_login_attempts enable row level security;
revoke all on table public.admin_login_attempts from anon, authenticated;
grant all on table public.admin_login_attempts to service_role;
