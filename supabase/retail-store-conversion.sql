-- Convert the public catalog to a single-merchant retail store.
-- Run after homepage-catalog.sql and complete-operations.sql.
begin;
drop policy if exists "seller inserts product" on public.products;
create policy "merchant inserts product" on public.products for insert with check(public.is_admin() and seller_id=auth.uid());
drop policy if exists "seller manages product" on public.products;
create policy "merchant manages product" on public.products for update using(public.is_admin()) with check(public.is_admin());

create or replace function public.public_store_catalog()
returns table(id uuid,title text,description text,price numeric,category text,condition public.product_condition,main_image text,location text,is_guaranteed boolean,created_at timestamptz,rating numeric,review_count bigint,sales_count bigint)
language sql stable security definer set search_path=public as $$
 select p.id,p.title,p.description,p.price,p.category,p.condition,p.main_image,p.location,p.is_guaranteed,p.created_at,
        coalesce(round(avg(r.rating)::numeric,1),0),count(distinct r.id),count(distinct d.id) filter(where d.status='completed')
 from public.products p join public.users owner on owner.id=p.seller_id and owner.user_type='admin'
 left join public.product_reviews r on r.product_id=p.id left join public.deals d on d.product_id=p.id
 where p.status='active'
 group by p.id,p.title,p.description,p.price,p.category,p.condition,p.main_image,p.location,p.is_guaranteed,p.created_at
 order by p.created_at desc $$;
revoke all on function public.public_store_catalog() from public;
grant execute on function public.public_store_catalog() to anon,authenticated;

update public.legal_documents set title='شروط وأحكام متجر وجهة',content=E'1. متجر وجهة متجر إلكتروني تديره مؤسسة يوسف عيد المطيري لقطع غيار السيارات والخدمات التجارية.\n2. الأسعار والمخزون ومدة التجهيز تظهر في صفحة المنتج، ويكتمل الطلب بعد قبول الدفع.\n3. يجب أن يكون العميل بعمر 18 عامًا فأكثر وأن يقدم بيانات صحيحة.\n4. يحظر إساءة استخدام المتجر أو الدفع أو تقديم مطالبات مضللة.\n5. تطبق سياسة الإرجاع والاسترداد المنشورة، وتنفذ المبالغ عبر وسيلة الدفع الأصلية.\n6. المنشأة غير مسجلة في ضريبة القيمة المضافة حاليًا، لذلك لا تحصل ضريبة قيمة مضافة.\n7. قد تتغير الأسعار والعروض قبل إتمام الطلب، ولا يتغير السعر بعد تأكيده إلا بموافقة العميل.',version='2.0',updated_at=now() where document_type='terms';
update public.legal_documents set title='سياسة الخصوصية',content=E'نجمع بيانات الحساب والتواصل والطلبات والشحن والدفع اللازمة لتشغيل المتجر.\nتستخدم البيانات لتنفيذ الطلب، خدمة العميل، منع الاحتيال والالتزام النظامي.\nلا نخزن بيانات البطاقة؛ تعالج لدى مزود الدفع المرخص.\nقد نشارك بيانات الطلب مع شركة الشحن ومزود الدفع بالقدر اللازم فقط.\nيمكن طلب الوصول أو التصحيح أو الحذف، مع الاحتفاظ بالسجلات التي تتطلبها الأنظمة.',version='2.0',updated_at=now() where document_type='privacy';
update public.legal_documents set title='سياسة الإرجاع والاسترداد',content=E'يحق للعميل طلب إرجاع المنتج المؤهل خلال 7 أيام من الاستلام ما لم يكن المنتج من الاستثناءات النظامية أو استعمل أو فتح بشكل يمنع إعادة بيعه.\nيجب أن يعود المنتج بحالته الأصلية مع ملحقاته وتغليفه وإثبات الشراء.\nتفحص المرتجعات قبل اعتماد الاسترداد.\nيعاد المبلغ إلى وسيلة الدفع الأصلية بعد الاعتماد، وقد تستغرق المعالجة البنكية مدة إضافية.\nيتحمل المتجر تكلفة الإرجاع عند الخطأ أو العيب المثبت، وفي حالات تغيير الرأي قد تخصم تكلفة الشحن بعد الإفصاح عنها.',version='2.0',updated_at=now() where document_type='refund';
update public.legal_documents set title='سياسة الشحن والتسليم',content=E'نوصل الطلبات داخل المملكة العربية السعودية إلى العنوان المسجل في الطلب.\nتظهر تكلفة الشحن والمدة التقديرية قبل تأكيد الطلب.\nيرسل رقم التتبع عند تسليم الشحنة للناقل.\nعلى العميل التأكد من صحة العنوان ورقم الجوال، والتواصل مع الدعم عند التأخر أو التلف الظاهر.\nالمدة تقديرية وقد تتأثر بالمناطق البعيدة والعطلات والظروف الخارجة عن السيطرة.',version='2.0',updated_at=now() where document_type='shipping';
commit;
