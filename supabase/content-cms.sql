-- Run in Supabase SQL Editor. Safe to run again; existing content is preserved.
begin;
create table if not exists public.wujha_cms_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.wujha_cms_admins enable row level security;
revoke all on public.wujha_cms_admins from anon, authenticated;
create or replace function public.wujha_is_cms_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.wujha_cms_admins where user_id = (select auth.uid())); $$;
revoke all on function public.wujha_is_cms_admin() from public;
grant execute on function public.wujha_is_cms_admin() to anon, authenticated;

create table if not exists public.wujha_cms_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('settings','image','review','seo')),
  slug text not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  published boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(kind,slug)
);
alter table public.wujha_cms_content enable row level security;
grant select on public.wujha_cms_content to anon;
grant select,insert,update,delete on public.wujha_cms_content to authenticated;
drop policy if exists wujha_cms_public_read on public.wujha_cms_content;
create policy wujha_cms_public_read on public.wujha_cms_content for select to anon,authenticated using (published);
drop policy if exists wujha_cms_admin_all on public.wujha_cms_content;
create policy wujha_cms_admin_all on public.wujha_cms_content for all to authenticated
using ((select public.wujha_is_cms_admin())) with check ((select public.wujha_is_cms_admin()));
insert into public.wujha_cms_content(kind,slug,data,published) values
('settings','home','{"hero_title":"","hero_description":"","hero_image":"","hero_alt":"","served_count":0,"completed_count":0,"years_count":0,"show_stats":false,"gallery_title":"من صورنا","reviews_title":"آراء عملائنا"}',true)
on conflict(kind,slug) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('wujha-content','wujha-content',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists wujha_cms_upload on storage.objects;
create policy wujha_cms_upload on storage.objects for insert to authenticated
with check(bucket_id='wujha-content' and (select public.wujha_is_cms_admin()));
drop policy if exists wujha_cms_media_read on storage.objects;
create policy wujha_cms_media_read on storage.objects for select to authenticated
using(bucket_id='wujha-content' and (select public.wujha_is_cms_admin()));
commit;

-- AFTER creating your administrator in Authentication > Users, replace the email:
-- insert into public.wujha_cms_admins(user_id)
-- select id from auth.users where lower(email)=lower('YOUR_ADMIN_EMAIL')
-- on conflict do nothing;
-- No administrator can be added from the browser or from user_metadata.
