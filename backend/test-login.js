require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const ws = require('ws')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws }
  }
)

const ADMIN_EMAIL = 'admin@svdke.com'
const ADMIN_PASSWORD = 'admin12345'

async function run() {
  console.log(`Attempting to sign in with: ${ADMIN_EMAIL}`)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })

    if (error) {
      console.error('Sign in Error:', error.message)
    } else {
      console.log('Sign in Success!')
      console.log('User:', data.user)
      console.log('Session exists:', !!data.session)
    }
  } catch (err) {
    console.error('Exception during sign in:', err.message)
  }
}

run()
