const { createClient } = require('@supabase/supabase-js');

// ==========================================================
// SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security entirely -- this
// is intentional and required for a backend that writes orders/licenses
// on its own, but it must NEVER be used in frontend code or exposed to
// the browser. It only ever lives in Vercel's Environment Variables.
// ==========================================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

module.exports = { supabase };
