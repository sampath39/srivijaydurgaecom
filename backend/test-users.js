require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const ADMIN_EMAIL = 'admin@svdke.com'
const ADMIN_PASSWORD = 'admin12345'

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })

  if (error) {
    console.error('Sign in failed:', error.message)
    return
  }

  const token = data.session.access_token
  
  try {
    const res = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    console.log('HTTP Status:', res.status)
    const json = await res.json()
    console.log('Response:', json)
  } catch (err) {
    console.error('Request failed:', err.message)
  }
}

run()
