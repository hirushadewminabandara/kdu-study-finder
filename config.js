// config.js
// Supabase Configuration for KDU Study Group Finder (KDU StudyConnect)
// General Sir John Kotelawala Defence University
//
// HOW TO CONNECT YOUR SUPABASE ACCOUNT:
// 1. Go to https://supabase.com and open your project dashboard.
// 2. Click the gear icon (Project Settings) at the bottom-left.
// 3. Navigate to "API" (under Configuration).
// 4. Copy "Project URL" and paste it into SUPABASE_URL below.
// 5. Copy "anon" / "public" Project API Key and paste it into SUPABASE_ANON_KEY below.

const SUPABASE_URL = "https://ergnurcmkixwtdqrxlfy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Bj1VmOfnpIQXIVAX8ChpbA_lUr0EZax";

function getSupabaseUrl() {
  if (typeof SUPABASE_URL === "string" && SUPABASE_URL.trim().length > 0 && !SUPABASE_URL.includes("YOUR_PROJECT")) {
    return SUPABASE_URL.trim();
  }
  return localStorage.getItem("kdu_supabase_url") || "";
}

function getSupabaseAnonKey() {
  if (typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY.trim().length > 0 && !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY")) {
    return SUPABASE_ANON_KEY.trim();
  }
  return localStorage.getItem("kdu_supabase_anon_key") || "";
}

function isSupabaseConfigured() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return url.length > 0 && !url.includes("YOUR_PROJECT") &&
         key.length > 0 && !key.includes("YOUR_ANON_KEY");
}
