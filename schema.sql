-- CM EATS starter schema: run in Supabase SQL editor after reviewing.
create extension if not exists pgcrypto;
create table if not exists public.restaurants(id uuid primary key default gen_random_uuid(),name text not null,category text,area text,image_url text,is_active boolean not null default false,created_at timestamptz not null default now());
create table if not exists public.menu_items(id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,name text not null,description text,price numeric(10,2) not null check(price>=0),image_url text,is_available boolean not null default false);
create table if not exists public.customer_profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text,phone text,updated_at timestamptz not null default now());
create table if not exists public.orders(id uuid primary key default gen_random_uuid(),customer_id uuid not null references auth.users(id),status text not null default 'pending',total_amount numeric(10,2) not null default 0,created_at timestamptz not null default now());
alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.orders enable row level security;
drop policy if exists "read active restaurants" on public.restaurants;
create policy "read active restaurants" on public.restaurants for select to anon,authenticated using(is_active=true);
drop policy if exists "read available menu items" on public.menu_items;
create policy "read available menu items" on public.menu_items for select to anon,authenticated using(is_available=true and exists(select 1 from public.restaurants r where r.id=restaurant_id and r.is_active=true));
drop policy if exists "read own profile" on public.customer_profiles;
create policy "read own profile" on public.customer_profiles for select to authenticated using(id=auth.uid());
drop policy if exists "insert own profile" on public.customer_profiles;
create policy "insert own profile" on public.customer_profiles for insert to authenticated with check(id=auth.uid());
drop policy if exists "update own profile" on public.customer_profiles;
create policy "update own profile" on public.customer_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists "read own orders" on public.orders;
create policy "read own orders" on public.orders for select to authenticated using(customer_id=auth.uid());
-- No direct client-side INSERT policy for orders: secure server checkout must validate totals, payment and delivery.
