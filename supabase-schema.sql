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
    ) or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Allow student insert join requests" on public.join_requests
  for insert with check (auth.uid() = student);

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
  (6, 'Faculty of Law', 'FOL'),
  (7, 'Faculty of Built Environment & Spatial Sciences', 'FBESS')
on conflict (id) do update set name = excluded.name, code = excluded.code;

insert into public.departments (id, faculty_id, name, code, programme) values
  (1, 1, 'Department of Information and Communication Technology', 'DICT', 'Bachelor of Technology Honours in Information and Communication Technology (BTech Hons in ICT)'),
  (2, 1, 'Department of Biosystems Technology', 'DBST', 'Bachelor of Biosystems Technology Honours in Applied Biotechnology (BBST Hons)'),
  (3, 1, 'Department of Engineering Technology', 'DET', 'Bachelor of Engineering Technology Honours (Construction / Building Services / Biomedical)'),
  (4, 2, 'Department of Computer Science', 'DCS', 'BSc (Hons) in Computer Science / BSc (Hons) in Software Engineering'),
  (5, 2, 'Department of Information Technology', 'DIT', 'BSc (Hons) in Information Technology / BSc (Hons) in Information Systems'),
  (6, 2, 'Department of Computer Engineering', 'DCE', 'BSc (Hons) in Computer Engineering'),
  (7, 2, 'Department of Computational Mathematics', 'DCM', 'Computational Mathematics & Statistical Computing'),
  (8, 3, 'Department of Civil Engineering', 'DCV', 'BSc (Hons) in Civil Engineering'),
  (9, 3, 'Department of Mechanical Engineering', 'DME', 'BSc (Hons) in Mechanical Engineering / Mechatronic Engineering'),
  (10, 3, 'Department of Electrical, Electronic and Telecommunication Engineering', 'DEET', 'BSc (Hons) in Electrical & Electronic / Telecommunication / Biomedical Eng'),
  (11, 3, 'Department of Aeronautical Engineering', 'DAE', 'BSc (Hons) in Aeronautical Engineering / Aircraft Maintenance Eng'),
  (12, 3, 'Department of Marine Engineering', 'DMR', 'BSc (Hons) in Marine Engineering / Naval Architecture'),
  (13, 3, 'Department of Mathematics', 'DMA', 'Engineering Mathematics & Analytical Methods'),
  (14, 4, 'Department of Management & Finance', 'DMF', 'BSc Logistics Management (Hons) / Management & Technical Sciences / Business Analytics'),
  (15, 4, 'Department of Social Sciences', 'DSS', 'BSc in Social Sciences'),
  (16, 4, 'Department of Languages', 'DLG', 'BA in Teaching English to Speakers of Other Languages (TESOL) / Applied Communication'),
  (17, 5, 'Department of Nursing & Midwifery', 'DNM', 'BSc (Hons) in Nursing'),
  (18, 5, 'Department of Medical Laboratory Sciences', 'DMLS', 'BSc (Hons) in Medical Laboratory Sciences'),
  (19, 5, 'Department of Pharmacy', 'DPH', 'Bachelor of Pharmacy Honours (BPharm)'),
  (20, 5, 'Department of Physiotherapy and Occupational Therapy', 'DPT', 'BSc (Hons) in Physiotherapy'),
  (21, 5, 'Department of Radiography and Radiotherapy', 'DRR', 'BSc (Hons) in Radiography / Radiotherapy'),
  (22, 6, 'Department of Law', 'DLAW', 'Bachelor of Laws Honours (LLB)'),
  (23, 7, 'Department of Architecture', 'DARC', 'Bachelor of Architecture Honours (BArch)'),
  (24, 7, 'Department of Spatial Sciences', 'DSPS', 'BSc (Hons) in Surveying Sciences / Cartography & GIS'),
  (25, 7, 'Department of Quantity Surveying', 'DQS', 'BSc (Hons) in Quantity Surveying')
on conflict (id) do update set name = excluded.name, code = excluded.code, programme = excluded.programme;

insert into public.courses (id, department_id, code, title, year_of_study) values
  -- Faculty of Technology: DICT
  (101, 1, 'ICT1113', 'Fundamentals of Programming', 1),
  (102, 1, 'ICT1123', 'Computer Systems & Architecture', 1),
  (103, 1, 'ICT1133', 'Mathematics for Technology', 1),
  (104, 1, 'ICT1213', 'Object Oriented Programming', 1),
  (105, 1, 'ICT1223', 'Data Structures & Algorithms', 1),
  (106, 1, 'ICT1233', 'Database Management Systems', 1),
  (107, 1, 'ICT2113', 'Web Technologies & Applications', 2),
  (108, 1, 'ICT2123', 'Computer Networks & Data Communications', 2),
  (109, 1, 'ICT2133', 'Operating Systems & Linux Administration', 2),
  (110, 1, 'ICT2213', 'Software Engineering Principles', 2),
  (111, 1, 'ICT2223', 'Mobile Application Development', 2),
  (112, 1, 'ICT2282', 'Skill Development Project II (SDP II)', 2),
  (113, 1, 'EN1022', 'Professional English for Technology', 2),
  (114, 1, 'DL1012', 'Military Studies & Leadership', 2),
  -- Faculty of Technology: DBST
  (121, 2, 'BST1113', 'Cell Biology & Genetics', 1),
  (122, 2, 'BST1122', 'Biochemistry & Biomolecules', 1),
  (123, 2, 'BST1213', 'Microbiology & Immunology', 1),
  (124, 2, 'BST1223', 'Bioinformatics & Computational Biology', 2),
  (125, 2, 'BST2113', 'Bioprocess Technology', 2),
  (126, 2, 'BST2123', 'Molecular Biology Techniques', 2),
  (127, 2, 'BST2213', 'Agricultural Biotechnology & Food Security', 2),
  -- Faculty of Technology: DET
  (131, 3, 'BET1113', 'Engineering Mathematics', 1),
  (132, 3, 'BET1123', 'Fundamentals of Electrical & Electronics', 1),
  (133, 3, 'BET1213', 'Engineering Mechanics & Statics', 1),
  (134, 3, 'BET1223', 'Civil Engineering Materials & Surveying', 1),
  (135, 3, 'BET2113', 'Biomedical Instrumentation & Sensors', 2),
  (136, 3, 'BET2123', 'Building Services & HVAC Systems', 2),
  (137, 3, 'BET2213', 'Construction Technology & Project Management', 2),
  -- Faculty of Computing: DCS
  (201, 4, 'CS1012', 'Fundamentals of Programming', 1),
  (202, 4, 'CS1023', 'Computer Systems Architecture', 1),
  (203, 4, 'CS2023', 'Object Oriented Programming', 2),
  (204, 4, 'CS2033', 'Data Structures & Algorithms', 2),
  (205, 4, 'CS2043', 'Relational Database Theory & SQL', 2),
  (206, 4, 'SE2013', 'Software Architecture & Design Patterns', 2),
  (207, 4, 'SE2023', 'Software Quality Assurance & Testing', 2),
  (208, 4, 'CS2082', 'Artificial Intelligence', 2),
  (209, 4, 'CS3082', 'Mobile Computing & Applications', 3),
  (210, 4, 'CS4013', 'Machine Learning & Neural Networks', 4),
  -- Faculty of Computing: DIT
  (221, 5, 'IT1013', 'Fundamentals of Information Systems', 1),
  (222, 5, 'IT1023', 'Web Applications Development', 1),
  (223, 5, 'IT2013', 'Data Communication & Computer Networks', 2),
  (224, 5, 'IT2023', 'Network Security & Information Assurance', 2),
  (225, 5, 'IT2033', 'Cloud Computing & Virtualization', 2),
  (226, 5, 'DS2013', 'Foundations of Data Science & Python', 2),
  (227, 5, 'IS2013', 'Enterprise Architecture & Business Systems', 2),
  -- Faculty of Computing: DCE
  (241, 6, 'CE1013', 'Digital Logic Design', 1),
  (242, 6, 'CE1023', 'Computer Architecture & Organization', 1),
  (243, 6, 'CE2013', 'Microcontrollers & Embedded Systems', 2),
  (244, 6, 'CE2023', 'Signals & Systems Analysis', 2),
  -- Faculty of Computing: DCM
  (261, 7, 'CM1013', 'Discrete Mathematics', 1),
  (262, 7, 'CM1023', 'Probability & Statistics for Computing', 1),
  (263, 7, 'CM2013', 'Operations Research & Optimization', 2),
  -- Faculty of Engineering: DCV
  (301, 8, 'CV1013', 'Engineering Geology & Soil Mechanics', 1),
  (302, 8, 'CV2013', 'Mechanics of Fluids & Hydraulics', 2),
  (303, 8, 'CV2023', 'Structural Analysis I', 2),
  (304, 8, 'CV2033', 'Surveying & Geomatics', 2),
  -- Faculty of Engineering: DME
  (321, 9, 'ME1013', 'Engineering Thermodynamics', 1),
  (322, 9, 'ME1023', 'Fluid Mechanics & Machinery', 1),
  (323, 9, 'ME2013', 'Mechanics of Machines & Vibration', 2),
  (324, 9, 'MC2013', 'Sensors & Actuators in Mechatronics', 2),
  (325, 9, 'MC2023', 'Robotics & Industrial Automation', 2),
  -- Faculty of Engineering: DEET
  (341, 10, 'EE1013', 'Circuit Theory & Network Analysis', 1),
  (342, 10, 'EE1023', 'Analog Electronic Circuits', 1),
  (343, 10, 'TE2013', 'Digital Communication Engineering', 2),
  (344, 10, 'TE2023', 'Electromagnetic Waves & Transmission Lines', 2),
  (345, 10, 'BM2013', 'Biomedical Instrumentation & Physiological Modeling', 2),
  -- Faculty of Engineering: DAE
  (361, 11, 'AE1013', 'Introduction to Aeronautics & Flight Mechanics', 1),
  (362, 11, 'AE2013', 'Aircraft Aerodynamics & Computational Fluid Dynamics', 2),
  (363, 11, 'AE2023', 'Aircraft Propulsion & Gas Turbine Engines', 2),
  (364, 11, 'AE2033', 'Aircraft Structures & Material Science', 2),
  -- Faculty of Engineering: DMR
  (381, 12, 'MR1013', 'Marine Engineering Knowledge', 1),
  (382, 12, 'NA2013', 'Naval Architecture & Ship Stability', 2),
  (383, 12, 'MR2023', 'Marine Auxiliary Machinery & Systems', 2),
  -- Faculty of Engineering: DMA
  (391, 13, 'MA1013', 'Engineering Mathematics I', 1),
  (392, 13, 'MA1023', 'Engineering Mathematics II (Calculus & Linear Algebra)', 1),
  (393, 13, 'MA2013', 'Differential Equations & Numerical Methods', 2),
  -- Faculty of Management, Social Sciences & Humanities: DMF
  (401, 14, 'LM1013', 'Principles of Supply Chain Management', 1),
  (402, 14, 'LM2013', 'Freight Forwarding, Ports & Shipping Operations', 2),
  (403, 14, 'MF1013', 'Financial Accounting & Cost Control', 1),
  (404, 14, 'BA2013', 'Business Analytics & Predictive Modeling', 2),
  (405, 14, 'MS1013', 'Operations Research & Quantitative Methods', 2),
  -- Faculty of Management, Social Sciences & Humanities: DSS
  (421, 15, 'SS1013', 'Introduction to International Relations', 1),
  (422, 15, 'SS1023', 'Political Science & Strategic Governance', 1),
  (423, 15, 'SS2013', 'Peace, Conflict Resolution & Humanitarian Studies', 2),
  -- Faculty of Management, Social Sciences & Humanities: DLG
  (441, 16, 'EN1013', 'Academic & Professional English', 1),
  (442, 16, 'TS1013', 'Principles of English Language Teaching (TESOL)', 1),
  (443, 16, 'LG2013', 'Data Storytelling & Technical Communication', 2),
  -- Faculty of Allied Health Sciences: DNM
  (501, 17, 'NUR1013', 'Fundamentals of Nursing Practice', 1),
  (502, 17, 'NUR1023', 'Human Anatomy & Physiology', 1),
  (503, 17, 'NUR2013', 'Medical-Surgical Nursing I', 2),
  -- Faculty of Allied Health Sciences: DMLS
  (521, 18, 'MLS1013', 'Clinical Biochemistry I', 1),
  (522, 18, 'MLS1023', 'Medical Microbiology & Virology', 2),
  (523, 18, 'MLS2013', 'Hematology & Blood Transfusion Science', 2),
  -- Faculty of Allied Health Sciences: DPH
  (541, 19, 'PHA1013', 'Pharmaceutics I', 1),
  (542, 19, 'PHA1023', 'Pharmacology & Pharmacokinetics', 2),
  -- Faculty of Allied Health Sciences: DPT
  (561, 20, 'PHT1013', 'Biomechanics & Human Kinesiology', 1),
  (562, 20, 'PHT1023', 'Musculoskeletal Rehabilitation', 2),
  -- Faculty of Allied Health Sciences: DRR
  (581, 21, 'RAD1013', 'Medical Imaging & Radiographic Techniques', 1),
  (582, 21, 'RAD2013', 'Radiation Physics & Safety Protection', 2),
  -- Faculty of Law: DLAW
  (601, 22, 'LAW1013', 'Legal System of Sri Lanka', 1),
  (602, 22, 'LAW1023', 'Constitutional & Administrative Law', 1),
  (603, 22, 'LAW2013', 'Criminal Law & Penal Code Procedure', 2),
  (604, 22, 'LAW2023', 'Law of Contracts & Commercial Obligations', 2),
  (605, 22, 'LAW3013', 'Public International Law & Human Rights', 3),
  -- Faculty of Built Environment & Spatial Sciences: DARC
  (701, 23, 'ARC1013', 'Architectural Design Studio I', 1),
  (702, 23, 'ARC2013', 'Sustainable Building Climatology & Materials', 2),
  -- Faculty of Built Environment & Spatial Sciences: DSPS
  (721, 24, 'SPS1013', 'Geodesy & Land Surveying Principles', 1),
  (722, 24, 'SPS2013', 'Geographic Information Systems (GIS) & Remote Sensing', 2),
  -- Faculty of Built Environment & Spatial Sciences: DQS
  (741, 25, 'QS1013', 'Measurement of Building Works', 1),
  (742, 25, 'QS2013', 'Construction Economics & Cost Estimating', 2)
on conflict (id) do update set code = excluded.code, title = excluded.title;

-- Reset sequence IDs
select setval('faculties_id_seq', (select max(id) from faculties));
select setval('departments_id_seq', (select max(id) from departments));
select setval('courses_id_seq', (select max(id) from courses));
