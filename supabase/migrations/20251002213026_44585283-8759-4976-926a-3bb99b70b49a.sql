-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- PROFILES (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles owner can read own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles owner can update own"
on public.profiles for update
to authenticated
using (id = auth.uid());

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- USER ROLES (separate table for security)
create type public.app_role as enum ('owner', 'staff');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'owner',
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "user_roles readable by owner"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- CLIENTS
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  date_of_birth date,
  address_line text,
  pathisi text,
  registration_date date default current_date,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_clients_name on public.clients (last_name, first_name);
create index idx_clients_phone on public.clients (phone);
create index idx_clients_email on public.clients (email);
create index idx_clients_account on public.clients (account_id);

alter table public.clients enable row level security;

create policy "clients are scoped by account"
on public.clients for all
to authenticated
using (account_id = auth.uid())
with check (account_id = auth.uid());

-- PACKAGES
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  sessions_total int not null check (sessions_total > 0),
  sessions_used int not null default 0 check (sessions_used >= 0),
  price_per_session numeric(10,2),
  start_date date default current_date,
  end_date date,
  status text check (status in ('active','completed','expired')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_packages_client on public.packages (client_id);
create index idx_packages_account on public.packages (account_id);

alter table public.packages enable row level security;

create policy "packages by account"
on public.packages for all
to authenticated
using (account_id = auth.uid())
with check (account_id = auth.uid());

-- SESSIONS
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  session_number_in_package int,
  started_at timestamptz not null default now(),
  duration_minutes int,
  notes text,
  bill_amount numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sessions_client on public.sessions (client_id, started_at desc);
create index idx_sessions_account on public.sessions (account_id);

alter table public.sessions enable row level security;

create policy "sessions by account"
on public.sessions for all
to authenticated
using (account_id = auth.uid())
with check (account_id = auth.uid());

-- APPOINTMENTS
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  status text check (status in ('scheduled','completed','no_show','cancelled')) default 'scheduled',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_appts_time on public.appointments (start_time);
create index idx_appts_account on public.appointments (account_id);

alter table public.appointments enable row level security;

create policy "appointments by account"
on public.appointments for all
to authenticated
using (account_id = auth.uid())
with check (account_id = auth.uid());

-- PAYMENTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  amount numeric(10,2) not null check (amount >= 0),
  method text check (method in ('cash','card','bank','other')) default 'cash',
  paid_at timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

create index idx_payments_client on public.payments (client_id, paid_at desc);
create index idx_payments_account on public.payments (account_id);

alter table public.payments enable row level security;

create policy "payments by account"
on public.payments for all
to authenticated
using (account_id = auth.uid())
with check (account_id = auth.uid());

-- AUDIT LOG
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  account_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  action text not null,
  row_id uuid,
  at timestamptz default now(),
  details jsonb
);

alter table public.audit_log enable row level security;

create policy "audit readable by owner"
on public.audit_log for select
to authenticated
using (account_id = auth.uid());

-- TRIGGERS: updated_at auto-update
create or replace function public.touch_updated_at() 
returns trigger 
language plpgsql 
as $$
begin
  new.updated_at = now();
  return new;
end; 
$$;

create trigger clients_touch before update on public.clients
for each row execute function public.touch_updated_at();

create trigger packages_touch before update on public.packages
for each row execute function public.touch_updated_at();

create trigger sessions_touch before update on public.sessions
for each row execute function public.touch_updated_at();

create trigger appts_touch before update on public.appointments
for each row execute function public.touch_updated_at();

-- RPC: create session atomically
create or replace function public.create_session(
  p_client_id uuid,
  p_started_at timestamptz default now(),
  p_duration_minutes int default null,
  p_notes text default null
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account uuid := auth.uid();
  v_pkg public.packages;
  v_session public.sessions;
  v_next_num int;
  v_bill numeric(10,2);
begin
  select * into v_pkg
  from public.packages
  where account_id = v_account
    and client_id = p_client_id
    and status = 'active'
  order by start_date desc
  limit 1;

  if v_pkg.id is not null then
    v_next_num := v_pkg.sessions_used + 1;
    v_bill := v_pkg.price_per_session;
    
    insert into public.sessions (account_id, client_id, package_id, session_number_in_package,
                                 started_at, duration_minutes, notes, bill_amount)
    values (v_account, p_client_id, v_pkg.id, v_next_num, p_started_at, p_duration_minutes, p_notes, v_bill)
    returning * into v_session;

    update public.packages
      set sessions_used = sessions_used + 1,
          status = case when sessions_used + 1 >= sessions_total then 'completed' else status end,
          updated_at = now()
    where id = v_pkg.id and account_id = v_account;
  else
    insert into public.sessions (account_id, client_id, started_at, duration_minutes, notes)
    values (v_account, p_client_id, p_started_at, p_duration_minutes, p_notes)
    returning * into v_session;
  end if;

  return v_session;
end; 
$$;

-- VIEW: client balances
create or replace view public.v_client_balances as
select
  c.account_id,
  c.id as client_id,
  coalesce(sum(s.bill_amount),0) as total_billed,
  coalesce((select sum(p.amount) from public.payments p
            where p.client_id = c.id and p.account_id = c.account_id),0) as total_paid,
  coalesce(sum(s.bill_amount),0) - coalesce((select sum(p.amount) from public.payments p
            where p.client_id = c.id and p.account_id = c.account_id),0) as balance_due
from public.clients c
left join public.sessions s on s.client_id = c.id and s.account_id = c.account_id
group by c.account_id, c.id;

-- RLS for view via security definer
create or replace function public.client_balances()
returns table (client_id uuid, total_billed numeric, total_paid numeric, balance_due numeric)
language sql
security definer
stable
set search_path = public
as $$
  select v.client_id, v.total_billed, v.total_paid, v.balance_due
  from public.v_client_balances v
  where v.account_id = auth.uid();
$$;

-- DASHBOARD: sessions per day
create or replace function public.sessions_per_day(p_from date, p_to date)
returns table(day date, sessions_count bigint)
language sql
security definer
stable
set search_path = public
as $$
  select date(s.started_at) as day, count(*)
  from public.sessions s
  where s.account_id = auth.uid()
    and s.started_at >= p_from
    and s.started_at < (p_to + interval '1 day')
  group by date(s.started_at)
  order by day;
$$;

-- DASHBOARD: sessions per month
create or replace function public.sessions_per_month(p_year int)
returns table(month text, sessions_count bigint)
language sql
security definer
stable
set search_path = public
as $$
  select to_char(date_trunc('month', s.started_at), 'YYYY-MM') as month, count(*)
  from public.sessions s
  where s.account_id = auth.uid()
    and extract(year from s.started_at) = p_year
  group by 1
  order by 1;
$$;