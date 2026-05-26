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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })

  if (error) {
    console.error('Sign in failed:', error.message)
    return
  }

  const token = data.session.access_token
  console.log('Login success!')

  const endpoints = [
    '/api/admin/dashboard',
    '/api/admin/users',
    '/api/admin/orders',
    '/api/admin/inventory',
    '/api/products'
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:5000${ep}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log(`Endpoint ${ep} - Status: ${res.status}`)
      const json = await res.json()
      if (res.status !== 200) {
        console.log(`Error Response for ${ep}:`, json)
      } else {
        console.log(`Success for ${ep}! Keys:`, Object.keys(json))
      }
    } catch (err) {
      console.error(`Error requesting ${ep}:`, err.message)
    }
  }
}

run()
