const { createClient } = require('@supabase/supabase-js')
const ws = require('ws')

// Admin/service client (used when service role key is available)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws }
  }
)

/**
 * Creates a user-scoped Supabase client authenticated with the user's JWT.
 * This allows RLS policies (auth.uid() = user_id) to work even when the
 * service role key is not available / is set to anon key.
 *
 * @param {string} userToken - The user's JWT access token from Authorization header
 */
function getUserSupabase(userToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${userToken}` }
      }
    }
  )
}

module.exports = supabase
module.exports.getUserSupabase = getUserSupabase
