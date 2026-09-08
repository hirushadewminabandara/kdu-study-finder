// js/config.js
// Supabase Configuration for KDU Study Group Finder (KDU StudyConnect)
//
// When SUPABASE_URL and SUPABASE_ANON_KEY are filled in with your live project keys,
// the application automatically runs against your live Supabase Postgres database.
// If left as empty strings or placeholders, the app runs in full offline Demo Mode
// with pre-seeded KDU Faculty of Technology ICT Intake 43 data.

const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

function isSupabaseConfigured() {
  return typeof SUPABASE_URL === "string" &&
         SUPABASE_URL.trim().length > 0 &&
         !SUPABASE_URL.includes("YOUR_PROJECT") &&
         typeof SUPABASE_ANON_KEY === "string" &&
         SUPABASE_ANON_KEY.trim().length > 0 &&
         !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY");
}
