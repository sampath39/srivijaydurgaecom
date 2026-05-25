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
  console.log('1. Signing in as admin via Supabase...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })

  if (error) {
    console.error('Sign in failed:', error.message)
    return
  }

  const token = data.session.access_token
  console.log('Sign in success! Token acquired.')

  console.log('\n2. Querying /api/admin/dashboard using the token...')
  try {
    const res = await fetch('http://localhost:5000/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    console.log('HTTP Status:', res.status)
    const json = await res.json()
    console.log('Response JSON:', json)
  } catch (err) {
    console.error('API request failed:', err.message)
  }
}

run()
