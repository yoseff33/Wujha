-- Wujha / وجهة — Supabase schema
-- Run once in Supabase SQL Editor. Passwords belong exclusively to auth.users.
create extension if not exists pgcrypto;

create type public.user_type as enum ('buyer','seller','admin');
create type public.product_condition as enum ('new','used');
create type public.product_status as enum ('active','sold','banned');
create type public.deal_status as enum ('pending_payment','paid_held','seller_confirmed','delivered','completed','cancelled','disputed');
create type public.payment_gateway as enum ('Mada','Tabby','Tamara');
create type public.dispute_resolution as enum ('buyer_win','seller_win','split');
create type public.dispute_status as enum ('open','under_review','resolved');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text not null unique,
  user_type public.user_type not null default 'buyer',
  is_verified boolean not null default false,
  national_id text,
  commercial_register text,
  iban_bank text check (iban_bank is null or iban_bank ~ '^SA[0-9]{22}$'),
  created_at timestamptz not null default now(),
  constraint seller_commercial_data check (user_type <> 'seller' or commercial_register is null or length(commercial_register) between 10 and 15)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null check (length(title) between 3 and 160),
  description text not null default '',
  price numeric(12,2) not null check (price > 0),
  category text not null check (category in ('قطع غيار السيارات والنقل الثقيل','أجهزة وإلكترونيات وهواتف','أثاث منزلي','خدمات تقنية وتسويقية نيابة عن الغير')),
  condition public.product_condition not null,
  main_image text,
  vin text,
  location text,
  is_guaranteed boolean not null default true,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  buyer_id uuid not null references public.users(id),
  seller_id uuid not null references public.users(id),
  external_ad_url text,
  category text,
  fee_bearer text not null default 'buyer' check (fee_bearer in ('buyer','seller','split')),
  installment_enabled boolean not null default false,
  deal_price numeric(12,2) not null check (deal_price > 0),
  escrow_fee numeric(12,2) generated always as (greatest(round(deal_price * 0.025, 2), 50.00)) stored,
  vat numeric(12,2) generated always as (round(greatest(round(deal_price * 0.025, 2), 50.00) * 0.15, 2)) stored,
  total_amount_paid numeric(12,2) generated always as (deal_price + greatest(round(deal_price * 0.025, 2), 50.00) + round(greatest(round(deal_price * 0.025, 2), 50.00) * 0.15, 2)) stored,
  status public.deal_status not null default 'pending_payment',
  inspection_hours integer not null default 24 check (inspection_hours between 24 and 168),
  seller_confirmed_at timestamptz,
  delivered_at timestamptz,
  buyer_confirmation_deadline timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  constraint different_parties check (buyer_id <> seller_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  transaction_id text not null unique,
  payment_gateway public.payment_gateway not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now()
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  opened_by uuid not null references public.users(id),
  reason text not null check (length(reason) >= 10),
  attachments text[] not null default '{}',
  admin_response text,
  resolution public.dispute_resolution,
  status public.dispute_status not null default 'open',
  evidence_deadline timestamptz not null default (now() + interval '48 hours'),
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references public.deals(id) on delete restrict,
  invoice_number text not null unique,
  buyer_name text not null,
  total_escrow_fee numeric(12,2) not null,
  total_vat numeric(12,2) not null,
  net_payable_to_seller numeric(12,2) not null,
  generated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  event_type text not null check (event_type in ('deal_created','seller_confirmed','inspection_expired','dispute_opened','funds_released')),
  title text not null,
  body text not null,
  email_pending boolean not null default true,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  id boolean primary key default true check (id),
  fee_percent numeric(5,2) not null default 2.5,
  minimum_fee numeric(12,2) not null default 50,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (true) on conflict do nothing;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.users where id = auth.uid() and user_type = 'admin')
$$;

create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(id,name,email,phone,user_type,commercial_register)
  values(new.id, coalesce(new.raw_user_meta_data->>'name','مستخدم وجهة'), new.email, coalesce(new.phone,new.raw_user_meta_data->>'phone'),
    case when new.raw_user_meta_data->>'user_type' in ('buyer','seller') then (new.raw_user_meta_data->>'user_type')::public.user_type else 'buyer'::public.user_type end,
    new.raw_user_meta_data->>'commercial_register') on conflict(id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.set_delivery_deadline() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status='delivered' and old.status is distinct from 'delivered' then
    new.delivered_at=coalesce(new.delivered_at,now());
    new.buyer_confirmation_deadline=new.delivered_at + make_interval(hours=>new.inspection_hours);
  end if;
  if new.status='completed' and (new.delivered_at is null or now() < new.delivered_at + interval '24 hours') then
    raise exception 'Cannot release funds before 24 hours from delivery confirmation';
  end if;
  return new;
end $$;
create trigger deals_deadline_guard before update on public.deals for each row execute function public.set_delivery_deadline();

create or replace function public.notify_deal_event() returns trigger language plpgsql security definer set search_path = '' as $$
declare event text; recipient uuid;
begin
  if tg_op='INSERT' then event='deal_created'; recipient=new.seller_id;
  elsif new.status='seller_confirmed' and old.status is distinct from new.status then event='seller_confirmed'; recipient=new.buyer_id;
  elsif new.status='completed' and old.status is distinct from new.status then event='funds_released'; recipient=new.seller_id;
  else return new; end if;
  insert into public.notifications(user_id,deal_id,event_type,title,body) values(recipient,new.id,event,'تحديث على صفقة وجهة','طرأ تحديث جديد على الصفقة، يرجى مراجعة حسابك.');
  return new;
end $$;
create trigger deal_notifications after insert or update on public.deals for each row execute function public.notify_deal_event();

create or replace function public.notify_dispute() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.deals set status='disputed' where id=new.deal_id;
  insert into public.notifications(user_id,deal_id,event_type,title,body)
    select case when d.buyer_id=new.opened_by then d.seller_id else d.buyer_id end,new.deal_id,'dispute_opened','فُتح اعتراض','تم فتح اعتراض على الصفقة.' from public.deals d where d.id=new.deal_id;
  return new;
end $$;
create trigger dispute_notifications after insert on public.disputes for each row execute function public.notify_dispute();

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.deals enable row level security;
alter table public.payments enable row level security;
alter table public.disputes enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;
alter table public.platform_settings enable row level security;

create policy "public profiles limited" on public.users for select using (id=auth.uid() or public.is_admin());
create policy "own profile update" on public.users for update using (id=auth.uid()) with check (id=auth.uid() and user_type=(select u.user_type from public.users u where u.id=auth.uid()));
create policy "active products public" on public.products for select using (status='active' or seller_id=auth.uid() or public.is_admin());
create policy "seller inserts product" on public.products for insert with check (seller_id=auth.uid() and exists(select 1 from public.users u where u.id=auth.uid() and u.user_type='seller'));
create policy "seller manages product" on public.products for update using (seller_id=auth.uid() or public.is_admin()) with check (seller_id=auth.uid() or public.is_admin());
create policy "deal parties read" on public.deals for select using (buyer_id=auth.uid() or seller_id=auth.uid() or public.is_admin());
create policy "buyer creates deal" on public.deals for insert with check (buyer_id=auth.uid());
create policy "deal parties update" on public.deals for update using (buyer_id=auth.uid() or seller_id=auth.uid() or public.is_admin());
create policy "payment parties read" on public.payments for select using (exists(select 1 from public.deals d where d.id=deal_id and (d.buyer_id=auth.uid() or d.seller_id=auth.uid())) or public.is_admin());
create policy "buyer starts payment" on public.payments for insert with check (exists(select 1 from public.deals d where d.id=deal_id and d.buyer_id=auth.uid()));
create policy "dispute parties read" on public.disputes for select using (exists(select 1 from public.deals d where d.id=deal_id and (d.buyer_id=auth.uid() or d.seller_id=auth.uid())) or public.is_admin());
create policy "party opens dispute" on public.disputes for insert with check (opened_by=auth.uid() and exists(select 1 from public.deals d where d.id=deal_id and auth.uid() in (d.buyer_id,d.seller_id)));
create policy "admin resolves dispute" on public.disputes for update using (public.is_admin()) with check (public.is_admin());
create policy "invoice parties read" on public.invoices for select using (exists(select 1 from public.deals d where d.id=deal_id and (d.buyer_id=auth.uid() or d.seller_id=auth.uid())) or public.is_admin());
create policy "own notifications" on public.notifications for select using (user_id=auth.uid() or public.is_admin());
create policy "own notification read" on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "settings readable" on public.platform_settings for select using (true);
create policy "admin settings update" on public.platform_settings for update using (public.is_admin()) with check (public.is_admin());

create index products_search_idx on public.products using gin (to_tsvector('simple',coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(vin,'')));
create index deals_buyer_idx on public.deals(buyer_id,created_at desc);
create index deals_seller_idx on public.deals(seller_id,created_at desc);
create index notifications_user_idx on public.notifications(user_id,created_at desc);

-- Email delivery: create a Supabase Edge Function and Database Webhook on notifications INSERT.
-- Inspection expiry: schedule a Supabase Cron job to insert inspection_expired notifications
-- where buyer_confirmation_deadline <= now() and status='delivered'.
