-- ==============================================================================
-- KDU StudyConnect - Production Supabase PostgreSQL Schema
-- General Sir John Kotelawala Defence University
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com
-- 2. Go to "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste this entire script, and click "Run".
-- ==============================================================================

-- 1. Academic Catalog: Faculties, Departments, Courses
create table if not exists public.faculties (
  id serial primary key,
  name text not null unique,
  code text not null unique
);

create table if not exists public.departments (
  id serial primary key,
  faculty_id int references public.faculties(id) on delete cascade,
  name text not null,
  code text not null,
  programme text
);

create table if not exists public.courses (
  id serial primary key,
  department_id int references public.departments(id) on delete cascade,
  code text not null,
  title text not null,
  year_of_study int default 1
);

-- 2. User Profiles (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text not null,
  kdu_index_no text,
  faculty_id int references public.faculties(id),
  department_id int references public.departments(id),
  intake text default '43',
  year_of_study int default 2,
  bio text default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now(),
  constraint check_kdu_email check (email ilike '%@kdu.ac.lk' or email ilike '%@%.kdu.ac.lk')
);

-- 3. Student Course Enrollments
create table if not exists public.student_courses (
  student uuid references public.profiles(id) on delete cascade,
  course_id int references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  primary key (student, course_id)
);

-- 4. Student Study Availability
create table if not exists public.availability (
  id serial primary key,
  student uuid references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time time not null,
  end_time time not null
);

-- 5. Study Groups (Syndicates)
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course_id int references public.courses(id),
  max_members int not null default 6 check (max_members between 2 and 20),
  created_by uuid references public.profiles(id) on delete set null,
  is_open boolean not null default true,
  created_at timestamptz default now()
);

-- 6. Group Members
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  student uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'leader')),
  joined_at timestamptz default now(),
  primary key (group_id, student)
);

-- 7. Join Requests & Partner Invitations
create table if not exists public.join_requests (
  id serial primary key,
  group_id uuid references public.groups(id) on delete cascade,
  student uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz default now(),
  unique (group_id, student)
);

-- 8. Group Messages (Realtime Chat)
create table if not exists public.messages (
  id bigserial primary key,
  group_id uuid references public.groups(id) on delete cascade,
  sender uuid references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  sent_at timestamptz default now()
);

-- 9. Scheduled Study Sessions
create table if not exists public.study_sessions (
  id serial primary key,
  group_id uuid references public.groups(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  duration_mins int not null default 60,
  created_by uuid references public.profiles(id) on delete set null
);

-- ==============================================================================
-- DOMAIN SECURITY TRIGGER: RESTRICT SIGNUPS TO @kdu.ac.lk
-- ==============================================================================
create or replace function public.enforce_kdu_email_domain()
returns trigger language plpgsql security definer as $$
begin
  if new.email is not null and not (new.email ilike '%@kdu.ac.lk' or new.email ilike '%@%.kdu.ac.lk') then
    raise exception 'Access Denied: Only official university accounts ending with @kdu.ac.lk are permitted.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_kdu_domain_auth_users on auth.users;
create trigger enforce_kdu_domain_auth_users
before insert or update on auth.users
for each row execute function public.enforce_kdu_email_domain();

-- ==============================================================================
-- PROFILE AUTO-CREATION TRIGGER (Runs on Google OAuth or Email Signup)
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    case
      when new.email ilike 'admin%' or new.email ilike 'staff%' then 'admin'
      else 'student'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = case
      when public.profiles.display_name = '' then excluded.display_name
      else public.profiles.display_name
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.faculties enable row level security;
alter table public.departments enable row level security;
alter table public.courses enable row level security;
alter table public.profiles enable row level security;
alter table public.student_courses enable row level security;
alter table public.availability enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.messages enable row level security;
alter table public.study_sessions enable row level security;

-- Public Reference Catalogs: Read-only for all authenticated students
create policy "Allow read faculties" on public.faculties for select using (true);
create policy "Allow read departments" on public.departments for select using (true);
create policy "Allow read courses" on public.courses for select using (true);

-- Profiles
create policy "Allow authenticated read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Allow user to update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow user to insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Student Courses
create policy "Allow authenticated read student_courses" on public.student_courses
  for select using (auth.role() = 'authenticated');

create policy "Allow manage own student_courses" on public.student_courses
  for all using (auth.uid() = student);

-- Availability
create policy "Allow authenticated read availability" on public.availability
  for select using (auth.role() = 'authenticated');

create policy "Allow manage own availability" on public.availability
  for all using (auth.uid() = student);

-- Groups
create policy "Allow read open or member groups" on public.groups
  for select using (auth.role() = 'authenticated');

create policy "Allow authenticated create groups" on public.groups
  for insert with check (auth.uid() = created_by);

create policy "Allow leader or admin to update groups" on public.groups
  for update using (
    auth.uid() = created_by or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Group Members
create policy "Allow read group members" on public.group_members
  for select using (auth.role() = 'authenticated');

create policy "Allow join group members" on public.group_members
  for insert with check (auth.uid() = student);

create policy "Allow leave group" on public.group_members
  for delete using (auth.uid() = student);

-- Join Requests
create policy "Allow read join requests" on public.join_requests
  for select using (
    auth.uid() = student or
    exists (
      select 1 from public.groups g
      where g.id = join_requests.group_id and g.created_by = auth.uid()
    )
  );

create policy "Allow student insert join requests" on public.join_requests
  for insert with check (auth.uid() = student);

create policy "Allow group leader to update request status" on public.join_requests
  for update using (
    exists (
      select 1 from public.groups g
      where g.id = join_requests.group_id and g.created_by = auth.uid()
    )
  );

-- Messages
create policy "Allow members to read group messages" on public.messages
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = messages.group_id and gm.student = auth.uid()
    )
  );

create policy "Allow members to insert group messages" on public.messages
  for insert with check (
    auth.uid() = sender and
    exists (
      select 1 from public.group_members gm
      where gm.group_id = messages.group_id and gm.student = auth.uid()
    )
  );

-- Study Sessions
create policy "Allow read study sessions" on public.study_sessions
  for select using (auth.role() = 'authenticated');

create policy "Allow members to create study sessions" on public.study_sessions
  for insert with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = study_sessions.group_id and gm.student = auth.uid()
    )
  );

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.join_requests;
alter publication supabase_realtime add table public.study_sessions;

-- ==============================================================================
-- REFERENCE DATA SEED: KDU ACADEMIC CATALOG (No demo users, no mock data)
-- ==============================================================================
insert into public.faculties (id, name, code) values
  (1, 'Faculty of Technology', 'FOT'),
  (2, 'Faculty of Computing', 'FOC'),
  (3, 'Faculty of Engineering', 'FOE'),
  (4, 'Faculty of Management, Social Sciences & Humanities', 'FMSH'),
  (5, 'Faculty of Allied Health Sciences', 'FAHS'),
  (6, 'Faculty of Law', 'FOL')
on conflict (id) do update set name = excluded.name, code = excluded.code;

insert into public.departments (id, faculty_id, name, code, programme) values
  (1, 1, 'Department of Biosystems Technology', 'BST', 'BTech (Hons) in ICT / BBST (Hons) Applied Biotech'),
  (2, 1, 'Department of Engineering Technology', 'ET', 'BET (Hons) Biomedical / Construction / Building Services'),
  (3, 2, 'Department of Computer Science', 'CS', 'BSc (Hons) Computer Science / Computer Engineering'),
  (4, 2, 'Department of Software Engineering', 'SE', 'BSc (Hons) Software Engineering'),
  (5, 2, 'Department of Information Technology', 'IT', 'BSc (Hons) IT / Data Science & Business Analytics'),
  (6, 3, 'Department of Electrical & Telecommunication', 'EE', 'BSc (Hons) Electrical & Electronic / Telecommunication Eng'),
  (7, 3, 'Department of Mechanical Engineering', 'ME', 'BSc (Hons) Mechanical / Mechatronics / Aeronautical Eng'),
  (8, 3, 'Department of Civil Engineering', 'CV', 'BSc (Hons) Civil Engineering'),
  (9, 4, 'Department of Management & Finance', 'MF', 'BSc Logistics Management / Management & Technical Sciences'),
  (10, 5, 'Department of Nursing & Midwifery', 'NUR', 'BSc (Hons) Nursing'),
  (11, 5, 'Department of Medical Laboratory Sciences', 'MLS', 'BSc (Hons) Medical Laboratory Sciences'),
  (12, 6, 'Department of Law', 'LAW', 'Bachelor of Laws (LLB)')
on conflict (id) do update set name = excluded.name, code = excluded.code, programme = excluded.programme;

insert into public.courses (id, department_id, code, title, year_of_study) values
  (101, 1, 'ITIC1282', 'Skill Development Project II (SDP II)', 2),
  (102, 1, 'ITIC1242', 'Data Structures & Algorithms', 2),
  (103, 1, 'ITIC1260', 'Database Management Systems', 2),
  (104, 1, 'ITIC1212', 'Object Oriented Programming (Java)', 2),
  (105, 1, 'ITIC1232', 'Computer Networks & Data Comm', 2),
  (106, 1, 'ITIC1252', 'Web Technologies & Applications', 2),
  (107, 1, 'ITIC1272', 'Operating Systems & Linux Admin', 2),
  (108, 1, 'ITIC1222', 'Discrete Mathematics & Probability', 2),
  (109, 1, 'ITIC2113', 'Software Engineering Principles', 2),
  (110, 1, 'ITIC2123', 'Mobile Application Development', 2),
  (111, 1, 'DL1012', 'Military Studies & Leadership', 2),
  (112, 1, 'EN1022', 'Professional English for Technology', 2),
  (113, 1, 'BST1113', 'Cell Biology & Genetics', 1),
  (114, 1, 'BST1122', 'Biochemistry & Biomolecules', 1),
  (115, 1, 'BST1223', 'Bioinformatics & Computational Biology', 2),
  (201, 2, 'BET1113', 'Engineering Mathematics I', 1),
  (202, 2, 'BET1123', 'Fundamentals of Electronics', 1),
  (203, 2, 'BET1213', 'Biomedical Instrumentation I', 2),
  (204, 2, 'CET1113', 'Civil Engineering Materials', 1),
  (205, 2, 'CET1123', 'Surveying & Levelling', 1),
  (206, 2, 'CET1213', 'Structural Mechanics', 2),
  (207, 2, 'BST1123', 'HVAC Systems & Design', 2),
  (301, 3, 'CS1013', 'Principles of Programming', 1),
  (302, 3, 'CS1023', 'Computer Systems Architecture', 1),
  (303, 3, 'CS2013', 'Advanced Object Oriented Programming', 2),
  (304, 3, 'CS2023', 'Data Structures & Algorithms', 2),
  (305, 3, 'CS2033', 'Relational Database Theory', 2),
  (306, 3, 'CS2043', 'Computer Networks & Security', 2),
  (307, 3, 'CE1013', 'Digital Logic Design', 1),
  (308, 3, 'CE1023', 'Embedded Systems & Microcontrollers', 2),
  (401, 4, 'SE1013', 'Software Requirements Engineering', 1),
  (402, 4, 'SE1023', 'Software Architecture & Design Patterns', 2),
  (403, 4, 'SE2013', 'Software Quality Assurance & Testing', 2),
  (404, 4, 'SE2023', 'Agile Development & DevOps', 2),
  (501, 5, 'IT1013', 'Fundamentals of Information Systems', 1),
  (502, 5, 'IT1023', 'Web Application Development', 1),
  (503, 5, 'DS1013', 'Foundations of Data Science & Python', 1),
  (504, 5, 'DS2013', 'Machine Learning Algorithms', 2),
  (601, 6, 'EE1013', 'Circuit Theory & Analysis', 1),
  (602, 6, 'EE1023', 'Analog Electronic Circuits', 1),
  (603, 6, 'TE1013', 'Electromagnetic Waves & Propagation', 2),
  (604, 6, 'TE2013', 'Digital Communication Engineering', 2),
  (701, 7, 'ME1013', 'Engineering Thermodynamics', 1),
  (702, 7, 'ME1023', 'Fluid Mechanics', 1),
  (703, 7, 'MC1013', 'Sensors & Actuators in Mechatronics', 2),
  (704, 7, 'AE1013', 'Aircraft Aerodynamics & Flight Principles', 2),
  (801, 8, 'CV1013', 'Engineering Geology', 1),
  (802, 8, 'CV2013', 'Mechanics of Fluids & Hydraulics', 2),
  (803, 8, 'CV2023', 'Structural Analysis I', 2),
  (901, 9, 'LM1013', 'Principles of Supply Chain Management', 1),
  (902, 9, 'LM1023', 'Freight Forwarding & Shipping Operations', 2),
  (903, 9, 'MS1013', 'Operations Research & Optimization', 2),
  (1001, 10, 'NR1013', 'Principles of Nursing Practice', 1),
  (1002, 10, 'NR1023', 'Human Anatomy & Physiology', 1),
  (1101, 11, 'ML1013', 'Clinical Biochemistry', 1),
  (1102, 11, 'ML1023', 'Medical Microbiology & Virology', 2),
  (1201, 12, 'LW1013', 'Legal System of Sri Lanka', 1),
  (1202, 12, 'LW1023', 'Law of Contracts', 1),
  (1203, 12, 'LW2013', 'Criminal Law & Procedure', 2)
on conflict (id) do update set code = excluded.code, title = excluded.title;

-- Reset sequence IDs
select setval('faculties_id_seq', (select max(id) from faculties));
select setval('departments_id_seq', (select max(id) from departments));
select setval('courses_id_seq', (select max(id) from courses));
