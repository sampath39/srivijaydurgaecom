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
const ADMIN_PASSWORD = 'admin12345' // Much simpler, typo-free password!

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    console.log('1. Deleting existing admin user from auth.users and profiles (cascade)...')
    const deleteResult = await client.query(`
      DELETE FROM auth.users WHERE email = $1;
    `, [ADMIN_EMAIL])
    console.log(`Deleted user: ${deleteResult.rowCount} row(s) deleted.`)

    // Wait a brief moment
    await new Promise(r => setTimeout(r, 2000))

    console.log('\n2. Signing up admin user via Supabase Auth with simple password...')
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: { full_name: 'SVD Kadi Emporium Admin' }
      }
    })

    if (error) {
      throw error
    }
    console.log('Admin user signed up successfully!')

    // Wait for triggers to execute
    await new Promise(r => setTimeout(r, 2000))

    console.log('\n3. Confirming email and updating role in database...')
    const authUpdate = await client.query(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW(), 
          updated_at = NOW()
      WHERE email = $1;
    `, [ADMIN_EMAIL])
    console.log(`Confirmed auth.users: ${authUpdate.rowCount} row(s) updated.`)

    const profileUpdate = await client.query(`
      UPDATE public.profiles 
      SET role = 'admin' 
      WHERE email = $1;
    `, [ADMIN_EMAIL])
    console.log(`Updated public.profiles role: ${profileUpdate.rowCount} row(s) updated.`)

    // Verify result
    const { rows } = await client.query(`
      SELECT id, email, role, full_name 
      FROM public.profiles 
      WHERE email = $1;
    `, [ADMIN_EMAIL])
    console.log('\nResulting Admin Profile:', rows[0])

  } catch (err) {
    console.error('Operation failed:', err.message)
  } finally {
    await client.end()
  }
}

run()
