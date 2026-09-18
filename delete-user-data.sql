-- ==============================================================================
-- KDU StudyConnect - Delete ALL Data (Including Academic Catalog)
-- 
-- PURPOSE: Removes ALL rows from ALL tables, giving you a completely
--          clean database. You will need to re-run supabase-schema.sql
--          afterwards to re-seed the academic catalog.
--
-- HOW TO RUN:
--   1. Open your Supabase Dashboard: https://supabase.com
--   2. Go to "SQL Editor" in the left sidebar.
--   3. Click "New query", paste this entire script, and click "Run".
--
-- ⚠️  WARNING: This is IRREVERSIBLE. ALL data will be permanently deleted.
-- ==============================================================================

-- Wrap everything in a transaction so it's all-or-nothing
BEGIN;

-- Delete in reverse dependency order to avoid foreign key violations

-- 1. Group chat messages
TRUNCATE TABLE public.messages CASCADE;

-- 2. Scheduled study sessions
TRUNCATE TABLE public.study_sessions CASCADE;

-- 3. Join requests
TRUNCATE TABLE public.join_requests CASCADE;

-- 4. Group memberships
TRUNCATE TABLE public.group_members CASCADE;

-- 5. Study groups
TRUNCATE TABLE public.groups CASCADE;

-- 6. Student availability
TRUNCATE TABLE public.availability CASCADE;

-- 7. Student course enrollments
TRUNCATE TABLE public.student_courses CASCADE;

-- 8. User profiles (display_name, kdu_index_no, etc.)
TRUNCATE TABLE public.profiles CASCADE;

-- 9. Academic catalog tables
TRUNCATE TABLE public.courses CASCADE;
TRUNCATE TABLE public.departments CASCADE;
TRUNCATE TABLE public.faculties CASCADE;

COMMIT;

-- Verify: ALL tables should now be empty (0 rows)
SELECT 'messages' AS table_name, COUNT(*) AS row_count FROM public.messages
UNION ALL SELECT 'study_sessions', COUNT(*) FROM public.study_sessions
UNION ALL SELECT 'join_requests', COUNT(*) FROM public.join_requests
UNION ALL SELECT 'group_members', COUNT(*) FROM public.group_members
UNION ALL SELECT 'groups', COUNT(*) FROM public.groups
UNION ALL SELECT 'availability', COUNT(*) FROM public.availability
UNION ALL SELECT 'student_courses', COUNT(*) FROM public.student_courses
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'courses', COUNT(*) FROM public.courses
UNION ALL SELECT 'departments', COUNT(*) FROM public.departments
UNION ALL SELECT 'faculties', COUNT(*) FROM public.faculties;
