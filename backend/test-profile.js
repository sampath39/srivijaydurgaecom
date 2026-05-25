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

const TEST_EMAIL = 'admin@svdke.com'

async function run() {
  console.log(`Querying profile for: ${TEST_EMAIL}`)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single()

    if (error) {
      console.error('Profile Select Error:', error.message)
    } else {
      console.log('Profile Select Success!')
      console.log('Profile:', data)
    }
  } catch (err) {
    console.error('Exception:', err.message)
  }
}

run()
