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
  avatar_url text default '',
  bio text default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now(),
  constraint check_kdu_email check (email ilike '%@kdu.ac.lk' or email ilike '%@%.kdu.ac.lk')
);

-- Ensure avatar_url column exists for existing deployments
alter table public.profiles add column if not exists avatar_url text default '';

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
  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      ''
    ),
    case
      when new.email ilike 'admin%' or new.email ilike 'staff%' or lower(new.email) = '43-ict-0042@kdu.ac.lk' then 'admin'
      else 'student'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    avatar_url = case
      when public.profiles.avatar_url is null or public.profiles.avatar_url = '' then excluded.avatar_url
      else public.profiles.avatar_url
    end,
    role = case
      when excluded.email ilike 'admin%' or excluded.email ilike 'staff%' or lower(excluded.email) = '43-ict-0042@kdu.ac.lk' then 'admin'
      else public.profiles.role
    end,
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
drop policy if exists "Allow read faculties" on public.faculties;
create policy "Allow read faculties" on public.faculties for select using (true);

drop policy if exists "Allow read departments" on public.departments;
create policy "Allow read departments" on public.departments for select using (true);

drop policy if exists "Allow read courses" on public.courses;
create policy "Allow read courses" on public.courses for select using (true);

-- Profiles
drop policy if exists "Allow authenticated read profiles" on public.profiles;
create policy "Allow authenticated read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow user to update own profile" on public.profiles;
create policy "Allow user to update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Allow user to insert own profile" on public.profiles;
create policy "Allow user to insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Student Courses
drop policy if exists "Allow authenticated read student_courses" on public.student_courses;
create policy "Allow authenticated read student_courses" on public.student_courses
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow manage own student_courses" on public.student_courses;
create policy "Allow manage own student_courses" on public.student_courses
  for all using (auth.uid() = student);

-- Availability
drop policy if exists "Allow authenticated read availability" on public.availability;
create policy "Allow authenticated read availability" on public.availability
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow manage own availability" on public.availability;
create policy "Allow manage own availability" on public.availability
  for all using (auth.uid() = student);

-- Groups
drop policy if exists "Allow read open or member groups" on public.groups;
create policy "Allow read open or member groups" on public.groups
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow authenticated create groups" on public.groups;
create policy "Allow authenticated create groups" on public.groups
  for insert with check (auth.uid() = created_by);

drop policy if exists "Allow leader or admin to update groups" on public.groups;
create policy "Allow leader or admin to update groups" on public.groups
  for update using (
    auth.uid() = created_by or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Group Members
drop policy if exists "Allow read group members" on public.group_members;
create policy "Allow read group members" on public.group_members
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow join group members" on public.group_members;
create policy "Allow join group members" on public.group_members
  for insert with check (auth.uid() = student);

drop policy if exists "Allow leave group" on public.group_members;
create policy "Allow leave group" on public.group_members
  for delete using (auth.uid() = student);

-- Join Requests
drop policy if exists "Allow read join requests" on public.join_requests;
create policy "Allow read join requests" on public.join_requests
  for select using (
    auth.uid() = student or
    exists (
      select 1 from public.groups g
      where g.id = join_requests.group_id and g.created_by = auth.uid()
    ) or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Allow student insert join requests" on public.join_requests;
create policy "Allow student insert join requests" on public.join_requests
  for insert with check (auth.uid() = student);

drop policy if exists "Allow group leader or admin to update request status" on public.join_requests;
create policy "Allow group leader or admin to update request status" on public.join_requests
  for update using (
    exists (
      select 1 from public.groups g
      where g.id = join_requests.group_id and g.created_by = auth.uid()
    ) or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Messages
drop policy if exists "Allow members to read group messages" on public.messages;
create policy "Allow members to read group messages" on public.messages
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = messages.group_id and gm.student = auth.uid()
    )
  );

drop policy if exists "Allow members to insert group messages" on public.messages;
create policy "Allow members to insert group messages" on public.messages
  for insert with check (
    auth.uid() = sender and
    exists (
      select 1 from public.group_members gm
      where gm.group_id = messages.group_id and gm.student = auth.uid()
    )
  );

-- Study Sessions
drop policy if exists "Allow read study sessions" on public.study_sessions;
create policy "Allow read study sessions" on public.study_sessions
  for select using (auth.role() = 'authenticated');

drop policy if exists "Allow members to create study sessions" on public.study_sessions;
create policy "Allow members to create study sessions" on public.study_sessions
  for insert with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = study_sessions.group_id and gm.student = auth.uid()
    )
  );

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION & REPLICA IDENTITY
-- ==============================================================================
alter table public.messages replica identity full;
alter table public.groups replica identity full;
alter table public.join_requests replica identity full;
alter table public.study_sessions replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.groups;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.join_requests;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.study_sessions;
  exception when duplicate_object then null;
  end;
end $$;

-- ==============================================================================
-- REFERENCE DATA SEED: KDU ACADEMIC CATALOG (No demo users, no mock data)
-- ==============================================================================
insert into public.faculties (id, name, code) values
  (1, 'Faculty of Defence and Strategic Studies', 'FDSS'),
  (2, 'Faculty of Medicine', 'FOM'),
  (3, 'Faculty of Engineering', 'FOE'),
  (4, 'Faculty of Computing', 'FOC'),
  (5, 'Faculty of Management, Social Sciences & Humanities', 'FMSH'),
  (6, 'Faculty of Law', 'FOL'),
  (7, 'Faculty of Allied Health Sciences', 'FAHS'),
  (8, 'Faculty of Built Environment & Spatial Sciences', 'FBESS'),
  (9, 'Faculty of Technology', 'FOT'),
  (10, 'Faculty of Criminal Justice', 'FCJ'),
  (11, 'Faculty of Industrial Studies', 'FIS'),
  (12, 'Faculty of Graduate Studies', 'FGS')
on conflict (id) do update set name = excluded.name, code = excluded.code;

insert into public.departments (id, faculty_id, name, code, programme) values
  -- Faculty of Defence and Strategic Studies (FDSS)
  (1, 1, 'Department of Strategic Studies', 'DSS', 'BSc in Strategic Studies & International Relations'),
  (2, 1, 'Department of Military Studies', 'DMS', 'Military Training, Tactics & Strategic Leadership Structures'),
  -- Faculty of Medicine (FOM)
  (3, 2, 'Department of Anatomy', 'DAN', 'Bachelor of Medicine, Bachelor of Surgery (MBBS)'),
  (4, 2, 'Department of Physiology', 'DPHS', 'MBBS - Human Physiology & Biophysics'),
  (5, 2, 'Department of Biochemistry', 'DBC', 'MBBS - Medical Biochemistry & Molecular Genetics'),
  (6, 2, 'Department of Pathology', 'DPTH', 'MBBS - General & Systemic Pathology'),
  (7, 2, 'Department of Microbiology', 'DMCB', 'MBBS - Medical Microbiology & Immunology'),
  (8, 2, 'Department of Pharmacology', 'DPHM', 'MBBS - Pharmacology & Pharmacotherapeutics'),
  (9, 2, 'Department of Forensic Medicine', 'DFM', 'MBBS - Forensic Medicine & Toxicology'),
  (10, 2, 'Department of Public Health and Family Medicine', 'DPHFM', 'MBBS - Community Medicine & Public Health'),
  (11, 2, 'Department of Clinical Medicine', 'DCMED', 'MBBS - Internal Medicine & Therapeutics'),
  (12, 2, 'Department of Surgery', 'DSUR', 'MBBS - General Surgery & Operative Techniques'),
  (13, 2, 'Department of Paediatrics', 'DPAE', 'MBBS - Paediatric Medicine & Child Health'),
  (14, 2, 'Department of Obstetrics and Gynaecology', 'DOBG', 'MBBS - Obstetrics & Gynaecological Health'),
  (15, 2, 'Department of Psychiatry', 'DPSY', 'MBBS - Clinical Psychiatry & Behavioural Sciences'),
  -- Faculty of Engineering (FOE)
  (16, 3, 'Department of Aeronautical Engineering', 'DAE', 'BSc (Hons) in Aeronautical Engineering / Aircraft Maintenance Eng'),
  (17, 3, 'Department of Civil Engineering', 'DCV', 'BSc (Hons) in Civil Engineering'),
  (18, 3, 'Department of Electrical and Electronic Engineering', 'DEEE', 'BSc (Hons) in Electrical & Electronic / Telecommunication / Biomedical Eng'),
  (19, 3, 'Department of Mechanical Engineering', 'DME', 'BSc (Hons) in Mechanical Engineering / Mechatronic Engineering'),
  (20, 3, 'Department of Marine Engineering', 'DMR', 'BSc (Hons) in Marine Engineering / Naval Architecture'),
  (21, 3, 'Department of Mathematics', 'DMA', 'Engineering Mathematics & Analytical Methods'),
  -- Faculty of Computing (FOC)
  (22, 4, 'Department of Computer Science', 'DCS', 'BSc (Hons) in Computer Science / BSc (Hons) in Software Engineering'),
  (23, 4, 'Department of Information Technology', 'DIT', 'BSc (Hons) in Information Technology / BSc (Hons) in Information Systems'),
  (24, 4, 'Department of Computer Engineering', 'DCE', 'BSc (Hons) in Computer Engineering'),
  (25, 4, 'Department of Computational Mathematics', 'DCM', 'Computational Mathematics & Statistical Computing'),
  -- Faculty of Management, Social Sciences & Humanities (FMSH)
  (26, 5, 'Department of Management & Finance', 'DMF', 'BSc Logistics Management (Hons) / Management & Technical Sciences / Business Analytics'),
  (27, 5, 'Department of Social Sciences', 'DSS', 'BSc in Social Sciences'),
  (28, 5, 'Department of Languages', 'DLG', 'BA in Teaching English to Speakers of Other Languages (TESOL) / Applied Communication'),
  -- Faculty of Law (FOL)
  (29, 6, 'Department of Public Law', 'DPL', 'Bachelor of Laws Honours (LLB) - Public Law & Governance'),
  (30, 6, 'Department of Private Law', 'DPRL', 'Bachelor of Laws Honours (LLB) - Private & Commercial Law'),
  (31, 6, 'Department of International Law', 'DIL', 'Bachelor of Laws Honours (LLB) - International & Human Rights Law'),
  -- Faculty of Allied Health Sciences (FAHS)
  (32, 7, 'Department of Nursing & Midwifery', 'DNM', 'BSc (Hons) in Nursing'),
  (33, 7, 'Department of Physiotherapy', 'DPT', 'BSc (Hons) in Physiotherapy'),
  (34, 7, 'Department of Pharmacy', 'DPH', 'Bachelor of Pharmacy Honours (BPharm)'),
  (35, 7, 'Department of Medical Laboratory Sciences', 'DMLS', 'BSc (Hons) in Medical Laboratory Sciences'),
  (36, 7, 'Department of Radiography and Radiotherapy', 'DRR', 'BSc (Hons) in Radiography / Radiotherapy'),
  -- Faculty of Built Environment & Spatial Sciences (FBESS)
  (37, 8, 'Department of Architecture', 'DARC', 'Bachelor of Architecture Honours (BArch)'),
  (38, 8, 'Department of Quantity Surveying', 'DQS', 'BSc (Hons) in Quantity Surveying'),
  (39, 8, 'Department of Spatial Sciences', 'DSPS', 'BSc (Hons) in Surveying Sciences / Cartography & GIS'),
  -- Faculty of Technology (FOT) - Note: ICT is administered under Biosystems Technology
  (40, 9, 'Department of Engineering Technology', 'DET', 'Bachelor of Engineering Technology Honours (Construction / Building Services / Biomedical)'),
  (41, 9, 'Department of Biosystems Technology', 'DBST', 'Bachelor of Biosystems Technology Honours (BBST Hons) / Bachelor of Technology Honours in ICT (BTech Hons in ICT)'),
  -- Faculty of Criminal Justice (FCJ)
  (42, 10, 'Department of Criminology and Criminal Justice', 'DCCJ', 'BSc in Criminology & Criminal Justice'),
  (43, 10, 'Department of Law Enforcement', 'DLE', 'BSc in Law Enforcement & Police Science'),
  -- Faculty of Industrial Studies (FIS)
  (44, 11, 'Department of Industrial Studies', 'DIS', 'Bachelor of Industrial Studies (Southern Campus - Technical, Manufacturing & Industrial Studies)'),
  -- Faculty of Graduate Studies (FGS)
  (45, 12, 'Department of Graduate Studies', 'DGS', 'Postgraduate Education, Executive Diplomas & Master''s Degree Programmes')
on conflict (id) do update set name = excluded.name, code = excluded.code, programme = excluded.programme;

insert into public.courses (id, department_id, code, title, year_of_study) values
  -- Faculty of Defence and Strategic Studies: DSS & DMS
  (801, 1, 'DSS1013', 'Introduction to Strategic Studies', 1),
  (802, 1, 'DSS2013', 'National Security & Geopolitical Strategy', 2),
  (803, 1, 'DSS3013', 'Maritime Security & Regional Dynamics', 3),
  (804, 2, 'DMS1012', 'Military Leadership & Command Structures', 1),
  (805, 2, 'DMS2013', 'Defence Management & Tactical Operations', 2),
  -- Faculty of Medicine: Departments (MBBS)
  (811, 3, 'AN1013', 'Gross Anatomy & Embryology', 1),
  (812, 3, 'AN1023', 'Neuroanatomy & Histology', 1),
  (813, 4, 'PH1013', 'Cellular & Neurophysiology', 1),
  (814, 4, 'PH1023', 'Cardiovascular & Respiratory Physiology', 1),
  (815, 5, 'BC1013', 'Medical Biochemistry & Enzymology', 1),
  (816, 5, 'BC1023', 'Metabolic Pathways & Human Genetics', 1),
  (817, 6, 'PA2013', 'General Pathology & Pathophysiology', 2),
  (818, 6, 'PA2023', 'Systemic Pathology & Haematology', 2),
  (819, 7, 'MC2013', 'Medical Bacteriology & Virology', 2),
  (820, 7, 'MC2023', 'Immunology & Infectious Diseases', 2),
  (821, 8, 'PM2013', 'General Principles of Pharmacology', 2),
  (822, 8, 'PM2023', 'Clinical Pharmacotherapeutics', 2),
  (823, 9, 'FM3013', 'Forensic Medicine & Medical Jurisprudence', 3),
  (824, 9, 'FM3023', 'Clinical Forensic Toxicology', 3),
  (825, 10, 'PH3013', 'Epidemiology & Community Health', 3),
  (826, 10, 'PH3023', 'Family Medicine & Primary Healthcare', 3),
  (827, 11, 'CM4013', 'Internal Medicine & Diagnostics', 4),
  (828, 11, 'CM4023', 'Emergency & Critical Care Medicine', 4),
  (829, 12, 'SU4013', 'Principles of Surgery & Surgical Pathology', 4),
  (830, 12, 'SU4023', 'Trauma Management & Operative Care', 4),
  (831, 13, 'PD4013', 'Paediatric Medicine & Child Development', 4),
  (832, 13, 'PD4023', 'Neonatology & Paediatric Emergencies', 4),
  (833, 14, 'OG4013', 'Obstetric Care & Maternal Health', 4),
  (834, 14, 'OG4023', 'Gynaecological Oncology & Endocrinology', 4),
  (835, 15, 'PS4013', 'Clinical Psychiatry & Psychopathology', 4),
  (836, 15, 'PS4023', 'Behavioural Sciences & Psychotherapy', 4),
  -- Faculty of Engineering: DAE
  (361, 16, 'AE1013', 'Introduction to Aeronautics & Flight Mechanics', 1),
  (362, 16, 'AE2013', 'Aircraft Aerodynamics & Computational Fluid Dynamics', 2),
  (363, 16, 'AE2023', 'Aircraft Propulsion & Gas Turbine Engines', 2),
  (364, 16, 'AE2033', 'Aircraft Structures & Material Science', 2),
  -- Faculty of Engineering: DCV
  (301, 17, 'CV1013', 'Engineering Geology & Soil Mechanics', 1),
  (302, 17, 'CV2013', 'Mechanics of Fluids & Hydraulics', 2),
  (303, 17, 'CV2023', 'Structural Analysis I', 2),
  (304, 17, 'CV2033', 'Surveying & Geomatics', 2),
  -- Faculty of Engineering: DEEE
  (341, 18, 'EE1013', 'Circuit Theory & Network Analysis', 1),
  (342, 18, 'EE1023', 'Analog Electronic Circuits', 1),
  (343, 18, 'TE2013', 'Digital Communication Engineering', 2),
  (344, 18, 'TE2023', 'Electromagnetic Waves & Transmission Lines', 2),
  (345, 18, 'BM2013', 'Biomedical Instrumentation & Physiological Modeling', 2),
  -- Faculty of Engineering: DME
  (321, 19, 'ME1013', 'Engineering Thermodynamics', 1),
  (322, 19, 'ME1023', 'Fluid Mechanics & Machinery', 1),
  (323, 19, 'ME2013', 'Mechanics of Machines & Vibration', 2),
  (324, 19, 'MC2013', 'Sensors & Actuators in Mechatronics', 2),
  (325, 19, 'MC2023', 'Robotics & Industrial Automation', 2),
  -- Faculty of Engineering: DMR
  (381, 20, 'MR1013', 'Marine Engineering Knowledge', 1),
  (382, 20, 'NA2013', 'Naval Architecture & Ship Stability', 2),
  (383, 20, 'MR2023', 'Marine Auxiliary Machinery & Systems', 2),
  -- Faculty of Engineering: DMA
  (391, 21, 'MA1013', 'Engineering Mathematics I', 1),
  (392, 21, 'MA1023', 'Engineering Mathematics II (Calculus & Linear Algebra)', 1),
  (393, 21, 'MA2013', 'Differential Equations & Numerical Methods', 2),
  -- Faculty of Computing: DCS
  (201, 22, 'CS1012', 'Fundamentals of Programming', 1),
  (202, 22, 'CS1023', 'Computer Systems Architecture', 1),
  (203, 22, 'CS2023', 'Object Oriented Programming', 2),
  (204, 22, 'CS2033', 'Data Structures & Algorithms', 2),
  (205, 22, 'CS2043', 'Relational Database Theory & SQL', 2),
  (206, 22, 'SE2013', 'Software Architecture & Design Patterns', 2),
  (207, 22, 'SE2023', 'Software Quality Assurance & Testing', 2),
  (208, 22, 'CS2082', 'Artificial Intelligence', 2),
  (209, 22, 'CS3082', 'Mobile Computing & Applications', 3),
  (210, 22, 'CS4013', 'Machine Learning & Neural Networks', 4),
  -- Faculty of Computing: DIT
  (221, 23, 'IT1013', 'Fundamentals of Information Systems', 1),
  (222, 23, 'IT1023', 'Web Applications Development', 1),
  (223, 23, 'IT2013', 'Data Communication & Computer Networks', 2),
  (224, 23, 'IT2023', 'Network Security & Information Assurance', 2),
  (225, 23, 'IT2033', 'Cloud Computing & Virtualization', 2),
  (226, 23, 'DS2013', 'Foundations of Data Science & Python', 2),
  (227, 23, 'IS2013', 'Enterprise Architecture & Business Systems', 2),
  -- Faculty of Computing: DCE
  (241, 24, 'CE1013', 'Digital Logic Design', 1),
  (242, 24, 'CE1023', 'Computer Architecture & Organization', 1),
  (243, 24, 'CE2013', 'Microcontrollers & Embedded Systems', 2),
  (244, 24, 'CE2023', 'Signals & Systems Analysis', 2),
  -- Faculty of Computing: DCM
  (261, 25, 'CM1013', 'Discrete Mathematics', 1),
  (262, 25, 'CM1023', 'Probability & Statistics for Computing', 1),
  (263, 25, 'CM2013', 'Operations Research & Optimization', 2),
  -- Faculty of Management, Social Sciences & Humanities: DMF
  (401, 26, 'LM1013', 'Principles of Supply Chain Management', 1),
  (402, 26, 'LM2013', 'Freight Forwarding, Ports & Shipping Operations', 2),
  (403, 26, 'MF1013', 'Financial Accounting & Cost Control', 1),
  (404, 26, 'BA2013', 'Business Analytics & Predictive Modeling', 2),
  (405, 26, 'MS1013', 'Operations Research & Quantitative Methods', 2),
  -- Faculty of Management, Social Sciences & Humanities: DSS
  (421, 27, 'SS1013', 'Introduction to International Relations', 1),
  (422, 27, 'SS1023', 'Political Science & Strategic Governance', 1),
  (423, 27, 'SS2013', 'Peace, Conflict Resolution & Humanitarian Studies', 2),
  -- Faculty of Management, Social Sciences & Humanities: DLG
  (441, 28, 'EN1013', 'Academic & Professional English', 1),
  (442, 28, 'TS1013', 'Principles of English Language Teaching (TESOL)', 1),
  (443, 28, 'LG2013', 'Data Storytelling & Technical Communication', 2),
  -- Faculty of Law: DPL, DPRL, DIL
  (601, 30, 'LAW1013', 'Legal System of Sri Lanka', 1),
  (602, 29, 'LAW1023', 'Constitutional & Administrative Law', 1),
  (603, 29, 'LAW2013', 'Criminal Law & Penal Code Procedure', 2),
  (604, 30, 'LAW2023', 'Law of Contracts & Commercial Obligations', 2),
  (605, 31, 'LAW3013', 'Public International Law & Human Rights', 3),
  (606, 30, 'LAW3023', 'Law of Property & Delict', 3),
  (607, 31, 'LAW3033', 'International Humanitarian Law & Armed Conflict', 3),
  -- Faculty of Allied Health Sciences: DNM
  (501, 32, 'NUR1013', 'Fundamentals of Nursing Practice', 1),
  (502, 32, 'NUR1023', 'Human Anatomy & Physiology', 1),
  (503, 32, 'NUR2013', 'Medical-Surgical Nursing I', 2),
  -- Faculty of Allied Health Sciences: DPT
  (561, 33, 'PHT1013', 'Biomechanics & Human Kinesiology', 1),
  (562, 33, 'PHT1023', 'Musculoskeletal Rehabilitation', 2),
  -- Faculty of Allied Health Sciences: DPH
  (541, 34, 'PHA1013', 'Pharmaceutics I', 1),
  (542, 34, 'PHA1023', 'Pharmacology & Pharmacokinetics', 2),
  -- Faculty of Allied Health Sciences: DMLS
  (521, 35, 'MLS1013', 'Clinical Biochemistry I', 1),
  (522, 35, 'MLS1023', 'Medical Microbiology & Virology', 2),
  (523, 35, 'MLS2013', 'Hematology & Blood Transfusion Science', 2),
  -- Faculty of Allied Health Sciences: DRR
  (581, 36, 'RAD1013', 'Medical Imaging & Radiographic Techniques', 1),
  (582, 36, 'RAD2013', 'Radiation Physics & Safety Protection', 2),
  -- Faculty of Built Environment & Spatial Sciences: DARC
  (701, 37, 'ARC1013', 'Architectural Design Studio I', 1),
  (702, 37, 'ARC2013', 'Sustainable Building Climatology & Materials', 2),
  -- Faculty of Built Environment & Spatial Sciences: DQS
  (741, 38, 'QS1013', 'Measurement of Building Works', 1),
  (742, 38, 'QS2013', 'Construction Economics & Cost Estimating', 2),
  -- Faculty of Built Environment & Spatial Sciences: DSPS
  (721, 39, 'SPS1013', 'Geodesy & Land Surveying Principles', 1),
  (722, 39, 'SPS2013', 'Geographic Information Systems (GIS) & Remote Sensing', 2),
  -- Faculty of Technology: DET
  (131, 40, 'BET1113', 'Engineering Mathematics', 1),
  (132, 40, 'BET1123', 'Fundamentals of Electrical & Electronics', 1),
  (133, 40, 'BET1213', 'Engineering Mechanics & Statics', 1),
  (134, 40, 'BET1223', 'Civil Engineering Materials & Surveying', 1),
  (135, 40, 'BET2113', 'Biomedical Instrumentation & Sensors', 2),
  (136, 40, 'BET2123', 'Building Services & HVAC Systems', 2),
  (137, 40, 'BET2213', 'Construction Technology & Project Management', 2),
  -- Faculty of Technology: DBST (Applied Biotechnology & BTech Hons in ICT programmes)
  (121, 41, 'BST1113', 'Cell Biology & Genetics', 1),
  (122, 41, 'BST1122', 'Biochemistry & Biomolecules', 1),
  (123, 41, 'BST1213', 'Microbiology & Immunology', 1),
  (124, 41, 'BST1223', 'Bioinformatics & Computational Biology', 2),
  (125, 41, 'BST2113', 'Bioprocess Technology', 2),
  (126, 41, 'BST2123', 'Molecular Biology Techniques', 2),
  (127, 41, 'BST2213', 'Agricultural Biotechnology & Food Security', 2),
  (101, 41, 'ICT1113', 'Fundamentals of Programming', 1),
  (102, 41, 'ICT1123', 'Computer Systems & Architecture', 1),
  (103, 41, 'ICT1133', 'Mathematics for Technology', 1),
  (104, 41, 'ICT1213', 'Object Oriented Programming', 1),
  (105, 41, 'ICT1223', 'Data Structures & Algorithms', 1),
  (106, 41, 'ICT1233', 'Database Management Systems', 1),
  (107, 41, 'ICT2113', 'Web Technologies & Applications', 2),
  (108, 41, 'ICT2123', 'Computer Networks & Data Communications', 2),
  (109, 41, 'ICT2133', 'Operating Systems & Linux Administration', 2),
  (110, 41, 'ICT2213', 'Software Engineering Principles', 2),
  (111, 41, 'ICT2223', 'Mobile Application Development', 2),
  (112, 41, 'ICT2282', 'Skill Development Project (Second iteration)', 2),
  (113, 41, 'EN1022', 'Professional English for Technology', 2),
  (114, 41, 'DL1012', 'Military Studies & Leadership', 2),
  -- Faculty of Criminal Justice: DCCJ & DLE
  (851, 42, 'CJ1013', 'Introduction to Criminology & Criminal Justice', 1),
  (852, 42, 'CJ2013', 'Forensic Psychology & Criminal Behaviour', 2),
  (853, 42, 'CJ3013', 'Penology & Correctional Administration', 3),
  (854, 43, 'LE1013', 'Principles of Law Enforcement & Police Systems', 1),
  (855, 43, 'LE2013', 'Criminal Investigation & Crime Scene Management', 2),
  -- Faculty of Industrial Studies: DIS
  (861, 44, 'IND1013', 'Manufacturing Technology & Industrial Operations', 1),
  (862, 44, 'IND2013', 'Quality Assurance & Total Quality Management', 2),
  (863, 44, 'IND3013', 'Supply Chain Analytics & Lean Manufacturing', 3),
  -- Faculty of Graduate Studies: DGS
  (871, 45, 'FGS8013', 'Advanced Research Methodology & Academic Writing', 1),
  (872, 45, 'FGS8023', 'Strategic Leadership & Public Governance', 1),
  (873, 45, 'FGS8033', 'Project Management & Quantitative Data Analysis', 2)
on conflict (id) do update set code = excluded.code, title = excluded.title;

-- Reset sequence IDs
select setval('faculties_id_seq', (select max(id) from faculties));
select setval('departments_id_seq', (select max(id) from departments));
select setval('courses_id_seq', (select max(id) from courses));
