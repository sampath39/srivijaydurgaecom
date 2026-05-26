require('dotenv').config()
const { Client } = require('pg')
const { v4: uuidv4 } = require('uuid')

const productsData = [
  { slug: 'sarees', name: 'Premium Kanchipuram Silk Saree', desc: 'Handwoven pure silk saree with zari border.', original: 8999, sell: 7599 },
  { slug: 'sarees', name: 'Banarasi Cotton Blend Saree', desc: 'Lightweight comfortable saree for festive wear.', original: 4599, sell: 3299 },
  { slug: 'kadi-fabrics', name: 'Authentic Handspun Kadi Fabric', desc: '100% pure handspun kadi fabric by the meter.', original: 899, sell: 599 },
  { slug: 'dress-materials', name: 'Churidar Dress Material Unstitched', desc: 'Beautiful embroidery on premium cotton.', original: 2999, sell: 1899 },
  { slug: 'dupattas', name: 'Designer Phulkari Dupatta', desc: 'Vibrant colors and intricate thread work.', original: 1499, sell: 999 },
  { slug: 'kurtas-sets', name: 'Men\'s Festive Kurta Pajama Set', desc: 'Comfortable and elegant ethnic wear.', original: 3499, sell: 2499 },
  { slug: 'kurtas-sets', name: 'Women\'s A-Line Kurta Set', desc: 'Cotton kurta set with matching palazzos.', original: 2899, sell: 1999 },
  { slug: 'bedsheets', name: 'King Size Cotton Bedsheet', desc: 'Includes 2 pillow covers. 300 TC pure cotton.', original: 2599, sell: 1799 },
  { slug: 'towels', name: 'Luxury Bath Towel Set', desc: 'Super absorbent, 100% organic cotton towels.', original: 1299, sell: 899 },
  { slug: 'accessories', name: 'Traditional Potli Bag', desc: 'Handcrafted potli bag with bead work.', original: 999, sell: 699 }
]

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  console.log('Connected to DB. Fetching categories...')
  const catRes = await client.query('SELECT id, slug FROM categories')
  const categories = {}
  catRes.rows.forEach(row => { categories[row.slug] = row.id })

  for (const p of productsData) {
    const catId = categories[p.slug]
    if (!catId) {
      console.log(`Category ${p.slug} not found! Skipping ${p.name}.`)
      continue
    }

    const productId = uuidv4()
    await client.query(`
      INSERT INTO products (
        id, category_id, name, slug, description,
        original_price, selling_price, stock_quantity,
        is_featured, is_flash_sale, is_active,
        image_url, 
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12,
        NOW(), NOW()
      )
    `, [
      productId, catId, p.name, 
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random()*1000), 
      p.desc,
      p.original, p.sell, 50,
      true, true, true,
      '/cotton_saree_3d.png' // Using the 3d cotton placeholder image we have
    ])
    console.log(`Inserted: ${p.name}`)
  }

  await client.end()
  console.log('10 realistic products inserted successfully!')
}

main().catch(console.error)
