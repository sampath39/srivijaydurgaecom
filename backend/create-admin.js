require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { Client } = require('pg')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: require('ws') }
  }
)
const connectionString = process.env.DATABASE_URL

const ADMIN_EMAIL = 'admin@svdke.com'
const ADMIN_PASSWORD = 'SvdkeAdmin2026!'

async function run() {
  console.log('1. Signing up admin user via Supabase Auth...')
  try {
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: { full_name: 'SVD Kadi Emporium Admin' }
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('User already exists in Supabase Auth.')
      } else {
        throw error
      }
    } else {
      console.log('Admin user signed up successfully!')
    }
  } catch (err) {
    console.error('Auth signup failed:', err.message)
  }

  console.log('\n2. Updating email confirmation and role in database...')
  const client = new Client({ connectionString })
  try {
    await client.connect()

    // Update email confirmation status in auth.users
    const authUpdate = await client.query(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW(), 
          updated_at = NOW()
      WHERE email = $1;
    `, [ADMIN_EMAIL])
    console.log(`Updated auth.users confirmation: ${authUpdate.rowCount} row(s) updated.`)

    // Update role to admin in public.profiles
    const profileUpdate = await client.query(`
      UPDATE public.profiles 
      SET role = 'admin' 
      WHERE email = $1;
    `, [ADMIN_EMAIL])
    console.log(`Updated public.profiles role to admin: ${profileUpdate.rowCount} row(s) updated.`)

    // Verify profile role
    const { rows } = await client.query(`
      SELECT id, email, role, full_name 
      FROM public.profiles 
      WHERE email = $1;
    `, [ADMIN_EMAIL])
    console.log('Resulting Admin Profile:', rows[0])

  } catch (err) {
    console.error('Database update failed:', err.message)
  } finally {
    await client.end()
  }
}

run()
