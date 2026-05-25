require('dotenv').config()
const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    const query = `
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('products', 'categories');
    `
    const { rows } = await client.query(query)
    console.log('RLS Status of Tables:')
    rows.forEach(r => {
      console.log(`- Table: ${r.tablename}, RLS Enabled: ${r.rowsecurity}`)
    })
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
