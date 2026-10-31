-- Requires content-cms.sql. Run once in the same Supabase project.
begin;
create table if not exists public.wujha_page_views(
 event_id uuid primary key,
 session_id uuid not null,
 path text not null check(char_length(path) between 1 and 120),
 created_at timestamptz not null default now()
);
create index if not exists wujha_views_time on public.wujha_page_views(created_at);
create index if not exists wujha_views_session on public.wujha_page_views(session_id,created_at);
alter table public.wujha_page_views enable row level security;
revoke all on public.wujha_page_views from anon,authenticated;

create table if not exists public.wujha_leads(
 id uuid primary key,
 name text not null check(char_length(name) between 2 and 80),
 phone text not null check(phone ~ '^9665[0-9]{8}$'),
 request_type text not null check(request_type in ('product','cash','general')),
 provider text not null default '' check(char_length(provider)<=40),
 status text not null default 'new' check(status in ('new','contacted','waiting','completed','closed','do_not_contact')),
 notes text not null default '' check(char_length(notes)<=2000),
 contact_consent boolean not null check(contact_consent),
 consent_version text not null default 'request-followup-v1',
 consented_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists wujha_leads_time on public.wujha_leads(created_at desc);
create index if not exists wujha_leads_phone on public.wujha_leads(phone,created_at);
alter table public.wujha_leads enable row level security;
revoke all on public.wujha_leads from anon,authenticated;
grant select,update,delete on public.wujha_leads to authenticated;
drop policy if exists wujha_leads_admin on public.wujha_leads;
create policy wujha_leads_admin on public.wujha_leads for all to authenticated
using((select public.wujha_is_cms_admin())) with check((select public.wujha_is_cms_admin()));

create or replace function public.wujha_track_view(p_event uuid,p_session uuid,p_path text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if p_event is null or p_session is null or p_path is null or p_path not in ('/','/services/','/tamara/','/quara/','/emkan/','/tamam/','/blog/','/faq/','/about/','/contact/','/apply/') then return false; end if;
 if (select count(*) from public.wujha_page_views where session_id=p_session and created_at>now()-interval '1 day')>=200 then return false; end if;
 insert into public.wujha_page_views(event_id,session_id,path) values(p_event,p_session,p_path) on conflict do nothing;
 return true;
end;$$;
revoke all on function public.wujha_track_view(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.wujha_track_view(uuid,uuid,text) to anon,authenticated;

create or replace function public.wujha_submit_lead(p_id uuid,p_name text,p_phone text,p_type text,p_provider text,p_consent boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if p_consent is distinct from true then raise exception 'Contact consent required'; end if;
 if p_id is null or p_name is null or p_phone is null or p_type is null or char_length(trim(p_name)) not between 2 and 80 or p_phone !~ '^9665[0-9]{8}$' or p_type not in ('product','cash','general') or char_length(coalesce(p_provider,''))>40 then raise exception 'Invalid request'; end if;
 -- Bound concurrent submissions for one number without disclosing existing leads.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_phone,0));
 if exists(select 1 from public.wujha_leads where id=p_id) then return true; end if;
 if(select count(*) from public.wujha_leads where phone=p_phone and created_at>now()-interval '1 day')>=5 then raise exception 'Please try again later'; end if;
 insert into public.wujha_leads(id,name,phone,request_type,provider,contact_consent)
 values(p_id,trim(p_name),p_phone,p_type,coalesce(p_provider,''),true);
 return true;
end;$$;
revoke all on function public.wujha_submit_lead(uuid,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.wujha_submit_lead(uuid,text,text,text,text,boolean) to anon,authenticated;

create or replace function public.wujha_traffic_stats(p_days integer default 7)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare result jsonb; start_date timestamptz;
begin
 if not public.wujha_is_cms_admin() then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_days not in (1,7,30,90) then raise exception 'Invalid period'; end if;
 start_date:=date_trunc('day',now() at time zone 'Asia/Riyadh') at time zone 'Asia/Riyadh' - ((p_days-1)*interval '1 day');
 select jsonb_build_object(
 'views',(select count(*) from public.wujha_page_views where created_at>=start_date),
 'sessions',(select count(distinct session_id) from public.wujha_page_views where created_at>=start_date),
 'leads',(select count(*) from public.wujha_leads where created_at>=start_date),
 'new_leads',(select count(*) from public.wujha_leads where status='new'),
 'days',coalesce((select jsonb_agg(x order by x.day) from (
 select d::date as day,count(v.event_id) as views,count(distinct v.session_id) as sessions
 from generate_series((start_date at time zone 'Asia/Riyadh')::date,(now() at time zone 'Asia/Riyadh')::date,interval '1 day') d
 left join public.wujha_page_views v on (v.created_at at time zone 'Asia/Riyadh')::date=d::date
 group by d::date) x),'[]'::jsonb),
 'pages',coalesce((select jsonb_agg(x) from (select path,count(*) as views from public.wujha_page_views where created_at>=start_date group by path order by count(*) desc limit 15)x),'[]'::jsonb)
 ) into result;
 return result;
end;$$;
revoke all on function public.wujha_traffic_stats(integer) from public,anon,authenticated;
grant execute on function public.wujha_traffic_stats(integer) to authenticated;
commit;
