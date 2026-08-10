-- Public read-only catalog aggregates for the home page.
create or replace function public.public_store_catalog()
returns table(id uuid,title text,description text,price numeric,category text,condition public.product_condition,main_image text,location text,is_guaranteed boolean,created_at timestamptz,rating numeric,review_count bigint,sales_count bigint)
language sql stable security definer set search_path=public as $$
 select p.id,p.title,p.description,p.price,p.category,p.condition,p.main_image,p.location,p.is_guaranteed,p.created_at,
        coalesce(round(avg(r.rating)::numeric,1),0) rating,count(distinct r.id) review_count,
        count(distinct d.id) filter(where d.status='completed') sales_count
 from public.products p
 left join public.product_reviews r on r.product_id=p.id
 left join public.deals d on d.product_id=p.id
 where p.status='active'
 group by p.id,p.title,p.description,p.price,p.category,p.condition,p.main_image,p.location,p.is_guaranteed,p.created_at
 order by p.created_at desc;
$$;
revoke all on function public.public_store_catalog() from public;
grant execute on function public.public_store_catalog() to anon,authenticated;
