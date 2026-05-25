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
    const { rows: products } = await client.query('SELECT id, name, category_id, is_active FROM public.products')
    console.log(`Total products in database: ${products.length}`)
    
    const { rows: categories } = await client.query('SELECT id, name, slug FROM public.categories')
    console.log(`Total categories in database: ${categories.length}`)
    console.log('Categories list:', categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })))

    console.log('\nProduct Check:')
    for (const p of products) {
      const match = categories.find(c => c.id === p.category_id)
      console.log(`- Product: "${p.name}" (Active: ${p.is_active})`)
      console.log(`  Category ID: ${p.category_id}`)
      console.log(`  Matched Category: ${match ? `"${match.name}" (slug: ${match.slug})` : 'NONE ❌'}`)
    }
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
