require('dotenv').config()
const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    console.log('Synchronizing missing profiles...')
    const query = `
      INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
      SELECT id, email, 'customer', COALESCE(raw_user_meta_data->>'full_name', 'Customer'), created_at, created_at
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    `
    const res = await client.query(query)
    console.log(`Successfully synchronized ${res.rowCount} profile(s).`)
  } catch (err) {
    console.error('Error during sync:', err.message)
  } finally {
    await client.end()
  }
}

run()
