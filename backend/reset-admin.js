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

const ADMIN_EMAIL = 'admin@gmail.com'
const ADMIN_PASSWORD = 'admin123'

async function run() {
  console.log('1. Connecting to database to clean up old user if exists...')
  const client = new Client({ connectionString })
  try {
    await client.connect()

    // Delete existing user if exists so we can recreate it with new password
    const deleteRes = await client.query(`
      DELETE FROM auth.users 
      WHERE email = $1;
    `, [ADMIN_EMAIL])
    if (deleteRes.rowCount > 0) {
      console.log(`Deleted existing user ${ADMIN_EMAIL} from auth.users.`)
    } else {
      console.log(`User ${ADMIN_EMAIL} not found in database. Proceeding...`)
    }

    console.log('\n2. Signing up new admin user via Supabase Auth...')
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: { full_name: 'Super Admin' }
      }
    })

    if (error) {
      throw error
    } else {
      console.log('Admin user signed up successfully!')
    }

    console.log('\n3. Updating email confirmation and role in database...')
    
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
    console.error('Operation failed:', err.message)
  } finally {
    await client.end()
  }
}

run()
