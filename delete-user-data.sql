-- ==============================================================================
-- KDU StudyConnect - Wipe All User Data (Keeps Academic Catalog Intact)
-- 
-- PURPOSE: Removes all user profiles, accounts, study groups, messages, 
--          sessions, and enrollments while KEEPING all faculties, 
--          departments, and courses intact.
--
-- HOW TO RUN:
--   1. Open your Supabase Dashboard: https://supabase.com
--   2. Go to "SQL Editor" in the left sidebar.
--   3. Click "New query", paste this entire script, and click "Run".
--
-- ⚠️  WARNING: This permanently deletes all user activity and accounts.
-- ==============================================================================

BEGIN;

-- 1. Remove all user-generated content (in reverse dependency order)
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.study_sessions CASCADE;
TRUNCATE TABLE public.join_requests CASCADE;
TRUNCATE TABLE public.group_members CASCADE;
TRUNCATE TABLE public.groups CASCADE;
TRUNCATE TABLE public.availability CASCADE;
TRUNCATE TABLE public.student_courses CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 2. Delete all registered accounts in Supabase Auth
DELETE FROM auth.users;

COMMIT;

-- ==============================================================================
-- VERIFICATION QUERY
-- Expected result: 
--   User tables = 0 rows
--   Catalog tables (faculties, departments, courses) = intact (> 0 rows)
-- ==============================================================================
SELECT 'messages' AS table_name, COUNT(*) AS row_count FROM public.messages
UNION ALL SELECT 'study_sessions', COUNT(*) FROM public.study_sessions
UNION ALL SELECT 'join_requests', COUNT(*) FROM public.join_requests
UNION ALL SELECT 'group_members', COUNT(*) FROM public.group_members
UNION ALL SELECT 'groups', COUNT(*) FROM public.groups
UNION ALL SELECT 'availability', COUNT(*) FROM public.availability
UNION ALL SELECT 'student_courses', COUNT(*) FROM public.student_courses
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'auth.users', COUNT(*) FROM auth.users
UNION ALL SELECT 'faculties (kept)', COUNT(*) FROM public.faculties
UNION ALL SELECT 'departments (kept)', COUNT(*) FROM public.departments
UNION ALL SELECT 'courses (kept)', COUNT(*) FROM public.courses;
