require('dotenv').config()
const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    console.log('--- auth.users ---')
    const authResult = await client.query('SELECT id, email, created_at FROM auth.users')
    console.log(authResult.rows)

    console.log('\n--- public.profiles ---')
    const profileResult = await client.query('SELECT id, email, role, full_name, phone, created_at FROM public.profiles')
    console.log(profileResult.rows)
    console.log('\n--- pg_policies for profiles ---')
    const policyResult = await client.query("SELECT policyname, tablename, cmd, qual FROM pg_policies WHERE tablename = 'profiles'")
    console.log(policyResult.rows)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
