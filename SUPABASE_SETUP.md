# Nova Nurox — Supabase Setup

> ⚠️ **If you see "Could not find the table 'public.school_partnerships'"** or the Supabase Table Editor shows "Failed to fetch", run the SQL in **Section 3** below in your Supabase SQL Editor. Tables don't appear until you run the SQL.

## 1. Project credentials
Already configured in `.env`:
```
VITE_SUPABASE_URL=https://cyeskvdockcojtremqqa.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## 2. Create your Admin user (with TOTP)
1. Supabase → **Authentication → Users → Add user** (email + password).
2. Sign in at `/admin/login`.
3. On `/admin/mfa` enroll a TOTP factor (Google Authenticator / Authy).

---

## 3. Master SQL — run this entire block in Supabase SQL Editor

This block is **idempotent** — safe to re-run. It creates all 3 tables (signups, school_partnerships, student_enrollments) plus RLS policies and the `paid_count()` RPC.

```sql
-- =============================================================
-- 1) SIGNUPS (Alpha Batch — direct individual signups)
-- =============================================================
create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  city text,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;

drop policy if exists "anyone can signup" on public.signups;
create policy "anyone can signup"
  on public.signups for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admin can read"   on public.signups;
drop policy if exists "admin can update" on public.signups;
drop policy if exists "admin can delete" on public.signups;

create policy "admin can read"
  on public.signups for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can update"
  on public.signups for update
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can delete"
  on public.signups for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

-- Public seat counter (paid signups)
create or replace function public.paid_count()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.signups where paid = true;
$$;

grant execute on function public.paid_count() to anon, authenticated;

-- =============================================================
-- 2) SCHOOL_PARTNERSHIPS (used by /partner form + /enroll dropdown)
-- =============================================================
create table if not exists public.school_partnerships (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  principal_name text not null,
  contact_person text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  preferred_start_date date not null,
  student_capacity int not null default 100 check (student_capacity in (20, 40, 60, 80, 100)),
  total_pay_amount int not null default 0,
  payment_paid boolean not null default false,
  agreed_payment_model boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Idempotent column adds for existing installs
alter table public.school_partnerships
  add column if not exists student_capacity int default 100 check (student_capacity in (20, 40, 60, 80, 100));
alter table public.school_partnerships
  add column if not exists total_pay_amount int not null default 0;
alter table public.school_partnerships
  add column if not exists payment_paid boolean not null default false;

alter table public.school_partnerships enable row level security;

drop policy if exists "anyone can submit partnership"   on public.school_partnerships;
drop policy if exists "admin can read partnerships"     on public.school_partnerships;
drop policy if exists "admin can update partnerships"   on public.school_partnerships;
drop policy if exists "admin can delete partnerships"   on public.school_partnerships;
drop policy if exists "anon can read approved schools"  on public.school_partnerships;

-- Anyone can submit a partnership request
create policy "anyone can submit partnership"
  on public.school_partnerships for insert
  to anon, authenticated
  with check (true);

-- PII protection: do NOT expose principal_name / contact_person / whatsapp to
-- anonymous visitors. The /enroll dropdown calls the SECURITY DEFINER RPC
-- list_partner_schools() below, which returns ONLY school_name.
drop policy if exists "anon can read approved schools" on public.school_partnerships;

-- Admin full access
create policy "admin can read partnerships"
  on public.school_partnerships for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can update partnerships"
  on public.school_partnerships for update
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can delete partnerships"
  on public.school_partnerships for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

-- =============================================================
-- 3) STUDENT_ENROLLMENTS (used by /enroll page)
-- =============================================================
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class_section text not null,
  school_name text not null,
  parent_whatsapp text not null check (parent_whatsapp ~ '^[0-9]{10}$'),
  paid boolean not null default false,
  batch_number int,
  created_at timestamptz not null default now()
);

alter table public.student_enrollments enable row level security;

drop policy if exists "anyone can enroll"            on public.student_enrollments;
drop policy if exists "admin can read enrollments"   on public.student_enrollments;
drop policy if exists "admin can update enrollments" on public.student_enrollments;
drop policy if exists "admin can delete enrollments" on public.student_enrollments;

create policy "anyone can enroll"
  on public.student_enrollments for insert
  to anon, authenticated
  with check (true);

create policy "admin can read enrollments"
  on public.student_enrollments for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can update enrollments"
  on public.student_enrollments for update
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can delete enrollments"
  on public.student_enrollments for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

-- =============================================================
-- 4) PUBLIC SCHOOL-NAME LOOKUP (for /enroll dropdown + capacity cap)
-- =============================================================
-- SECURITY DEFINER RPC returns school_name + agreed capacity + current
-- enrollment count. No PII (principal / contact / whatsapp) is exposed.
create or replace function public.list_partner_schools()
returns table(school_name text, student_capacity int, enrolled_count int)
language sql
security definer
set search_path = public
as $$
  select
    sp.school_name,
    coalesce(max(sp.student_capacity), 0) as student_capacity,
    coalesce((
      select count(*)::int
      from public.student_enrollments se
      where se.school_name = sp.school_name
    ), 0) as enrolled_count
  from public.school_partnerships sp
  where sp.approved = true
  group by sp.school_name
  order by sp.school_name;
$$;

grant execute on function public.list_partner_schools() to anon, authenticated;

-- =============================================================
-- 5) ENROLLMENT CAP TRIGGER (server-side enforcement)
-- =============================================================
create or replace function public.enforce_enrollment_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
  current_count int;
begin
  select max(student_capacity) into cap
    from public.school_partnerships
    where school_name = new.school_name and approved = true;

  if cap is null then
    raise exception 'School % is not an approved partner.', new.school_name
      using errcode = 'check_violation';
  end if;

  select count(*) into current_count
    from public.student_enrollments
    where school_name = new.school_name;

  if current_count >= cap then
    raise exception 'Enrollment for % is full (% / %).', new.school_name, current_count, cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_enrollment_cap on public.student_enrollments;
create trigger trg_enforce_enrollment_cap
  before insert on public.student_enrollments
  for each row execute function public.enforce_enrollment_cap();
```

After running, refresh the Supabase Table Editor. The 3 tables should appear under `public`.

---

## 4. PII protection

The `school_partnerships` table holds principal name, contact person, and WhatsApp numbers. The master SQL above intentionally has **no anonymous SELECT policy** on this table — anonymous visitors cannot read any rows directly. The `/enroll` page calls the `list_partner_schools()` RPC, which returns only `school_name`, `student_capacity`, and `enrolled_count`. Admins (`nuroxindiaofficial@gmail.com`) retain full access via the admin RLS policies.

---

## 5. Troubleshooting

- **"Failed to fetch" in Supabase Table Editor**: usually a transient network issue. Hard-refresh the Supabase dashboard or check your connection. If persistent, try a different browser.
- **"Could not find the table 'public.X' in the schema cache"**: the table doesn't exist yet — run Section 3 SQL.
- **Form submits but admin sees nothing**: confirm you're signed in as `nuroxindiaofficial@gmail.com` (the admin email in the RLS policies). Change the email in the policies if you use a different one.

## 6. Render Deployment notes
Build: `npm install --include=dev && npm run build`
Start: `npm run start`

---

## 7. Add Student Capacity column (run if upgrading)

```sql
alter table public.school_partnerships
  add column if not exists student_capacity int
  check (student_capacity in (20, 40, 60, 80, 100));
```
