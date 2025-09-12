-- Functions to support public Student Portal login without weakening table RLS
-- This adds SECURITY DEFINER RPCs that validate credentials and return only the necessary data

-- 1) Login function: returns the student row if username/password match
create or replace function public.fn_student_portal_login(
  p_username text,
  p_password text
)
returns public.students
language sql
security definer
set search_path = public, pg_temp
as $$
  select s.*
  from public.student_portals sp
  join public.students s on s.id = sp.student_id
  where sp.username = p_username
    and sp.password_hash = encode(convert_to(p_password,'UTF8'), 'base64')
  limit 1;
$$;

-- 2) Evaluations function: returns all evaluations for the authenticated student
create or replace function public.fn_student_evaluations(
  p_username text,
  p_password text
)
returns setof public.evaluations
language sql
security definer
set search_path = public, pg_temp
as $$
  select e.*
  from public.student_portals sp
  join public.students s on s.id = sp.student_id
  join public.evaluations e on e.student_id = s.id
  where sp.username = p_username
    and sp.password_hash = encode(convert_to(p_password,'UTF8'), 'base64')
  order by e.evaluation_date desc;
$$;

-- Grant execute permissions to anonymous and authenticated users for public portal access
grant execute on function public.fn_student_portal_login(text, text) to anon, authenticated;
grant execute on function public.fn_student_evaluations(text, text) to anon, authenticated;