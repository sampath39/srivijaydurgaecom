require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment')
  process.exit(1)
}

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    // 1. Check if public.profiles exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `
    const { rows } = await client.query(checkTableQuery)
    const tablesExist = rows[0].exists

    if (!tablesExist) {
      console.log('Tables do not exist. Loading schema.sql...')
      const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
      
      // Execute the schema SQL
      await client.query(schemaSql)
      console.log('Schema loaded successfully!')
    } else {
      console.log('Tables already exist.')
    }

    // 2. Fetch categories to get their IDs
    const { rows: categories } = await client.query('SELECT id, name, slug FROM public.categories')
    console.log(`Found ${categories.length} categories.`)

    if (categories.length === 0) {
      console.error('No categories found. Schema might not have seeded correctly.')
      await client.end()
      return
    }

    // Map categories by slug for easy lookup
    const catMap = {}
    categories.forEach(c => {
      catMap[c.slug] = c.id
    })

    // 3. Seed sample products if products table is empty
    const { rows: prodCheck } = await client.query('SELECT COUNT(*) FROM public.products')
    const productCount = parseInt(prodCheck[0].count, 10)

    if (productCount === 0) {
      console.log('Seeding sample products...')
      const sampleProducts = [
        // Sarees
        {
          name: 'Kanchipuram Pure Silk Saree',
          slug: 'kanchipuram-pure-silk-saree',
          price: 5499.00,
          discount_price: 4999.00,
          description: 'A beautiful handwoven Kanchipuram pure silk saree with elegant golden zari border. Perfect for weddings, festivals, and special occasions.',
          short_desc: 'Handwoven pure silk saree with golden zari.',
          stock_count: 15,
          sku: 'SAR-KAN-001',
          images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['sarees'],
          is_featured: true,
          fabric: 'Pure Silk',
          color: 'Crimson Red & Gold',
          size_options: ['Free Size']
        },
        {
          name: 'Classic Banarasi Brocade Saree',
          slug: 'classic-banarasi-brocade-saree',
          price: 6500.00,
          discount_price: 5800.00,
          description: 'Authentic Banarasi brocade saree featuring intricate floral motifs and rich pallu design. Handcrafted by master weavers in Varanasi.',
          short_desc: 'Authentic Banarasi brocade silk saree.',
          stock_count: 8,
          sku: 'SAR-BAN-002',
          images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['sarees'],
          is_featured: false,
          fabric: 'Katan Silk',
          color: 'Royal Blue & Silver',
          size_options: ['Free Size']
        },
        // Kadi Fabrics
        {
          name: 'Handspun Khadi Cotton Fabric',
          slug: 'handspun-khadi-cotton-fabric',
          price: 250.00,
          discount_price: null,
          description: 'Premium quality handspun and handwoven khadi cotton fabric. Highly breathable, soft, and perfect for shirts, kurtas, and summer wear. Priced per meter.',
          short_desc: 'Premium handspun khadi cotton fabric.',
          stock_count: 120,
          sku: 'FAB-KHA-001',
          images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['kadi-fabrics'],
          is_featured: true,
          fabric: '100% Khadi Cotton',
          color: 'Natural Off-White',
          size_options: ['Per Meter']
        },
        {
          name: 'Indigo Dabu Print Fabric',
          slug: 'indigo-dabu-print-fabric',
          price: 350.00,
          discount_price: 299.00,
          description: 'Natural indigo dyed cotton fabric featuring traditional Rajasthani Dabu mud-resist block printing. Perfect for ethnic wear. Priced per meter.',
          short_desc: 'Natural indigo block print fabric.',
          stock_count: 90,
          sku: 'FAB-IND-002',
          images: ['https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['kadi-fabrics'],
          is_featured: false,
          fabric: 'Cotton',
          color: 'Indigo Blue',
          size_options: ['Per Meter']
        },
        // Dress Materials
        {
          name: 'Chanderi Silk-Cotton Dress Material',
          slug: 'chanderi-silk-cotton-dress-material',
          price: 2200.00,
          discount_price: 1899.00,
          description: 'Chanderi silk-cotton unstitched salwar suite material set. Comes with top fabric, bottom fabric, and a beautifully coordinated sheer dupatta.',
          short_desc: 'Chanderi silk-cotton salwar suit material set.',
          stock_count: 25,
          sku: 'DRS-CHA-001',
          images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['dress-materials'],
          is_featured: true,
          fabric: 'Chanderi Silk Cotton',
          color: 'Mustard Yellow & Green',
          size_options: ['Unstitched']
        },
        // Dupattas
        {
          name: 'Handwoven Ikat Silk Dupatta',
          slug: 'handwoven-ikat-silk-dupatta',
          price: 1500.00,
          discount_price: 1250.00,
          description: 'Elegant handloom silk dupatta with Pochampally Ikat patterns. Adds a rich traditional touch to any solid color kurta or suit set.',
          short_desc: 'Pochampally Ikat handloom silk dupatta.',
          stock_count: 30,
          sku: 'DUP-IKA-001',
          images: ['https://images.unsplash.com/photo-1583391265517-35bbdba0122a?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['dupattas'],
          is_featured: false,
          fabric: 'Ikat Silk',
          color: 'Multi-color Red/Black',
          size_options: ['2.5 Meters']
        },
        // Kurtas & Sets
        {
          name: 'Premium Khadi Cotton Kurta',
          slug: 'premium-khadi-cotton-kurta',
          price: 1200.00,
          discount_price: 999.00,
          description: 'Classic mens straight-cut kurta made from organic handspun khadi cotton. Features full sleeves, mandarin collar, and side pockets.',
          short_desc: 'Classic mens handloom khadi cotton kurta.',
          stock_count: 50,
          sku: 'KRT-KHA-001',
          images: ['https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['kurtas-sets'],
          is_featured: true,
          fabric: 'Khadi Cotton',
          color: 'Forest Green',
          size_options: ['S', 'M', 'L', 'XL', 'XXL']
        },
        // Bedsheets
        {
          name: 'Jaipuri Floral Print Double Bedsheet',
          slug: 'jaipuri-floral-print-double-bedsheet',
          price: 1800.00,
          discount_price: 1499.00,
          description: 'Traditional Sanganeri block print 100% cotton double bedsheet with two matching pillow covers. Handcrafted in Jaipur.',
          short_desc: 'Cotton double bedsheet with Sanganeri block print.',
          stock_count: 40,
          sku: 'SHT-JAI-001',
          images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['bedsheets'],
          is_featured: false,
          fabric: '100% Cotton',
          color: 'White & Blue Floral',
          size_options: ['Double (90x108 inches)']
        },
        // Towels
        {
          name: 'Pure Cotton Handloom Towels (Set of 2)',
          slug: 'pure-cotton-handloom-towels-set-of-2',
          price: 600.00,
          discount_price: 499.00,
          description: 'Highly absorbent, lightweight, and quick-drying pure cotton handloom towels. Traditional design, ideal for daily bath use.',
          short_desc: 'Quick-dry handloom cotton towels (set of 2).',
          stock_count: 100,
          sku: 'TWL-COT-001',
          images: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['towels'],
          is_featured: false,
          fabric: 'Handloom Cotton',
          color: 'White with Red Border',
          size_options: ['Standard Bath Size']
        },
        // Accessories
        {
          name: 'Handcrafted Khadi Cotton Tote Bag',
          slug: 'handcrafted-khadi-cotton-tote-bag',
          price: 450.00,
          discount_price: 349.00,
          description: 'Eco-friendly and durable tote bag made of thick handloom khadi fabric. Features traditional embroidery and strong handles.',
          short_desc: 'Eco-friendly khadi cotton tote bag.',
          stock_count: 75,
          sku: 'ACC-TOT-001',
          images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80'],
          category_id: catMap['accessories'],
          is_featured: true,
          fabric: 'Khadi & Canvas',
          color: 'Beige & Indigo Block Print',
          size_options: ['One Size']
        }
      ]

      for (const prod of sampleProducts) {
        const query = `
          INSERT INTO public.products (
            name, slug, price, discount_price, description, short_desc, 
            stock_count, sku, images, category_id, is_featured, fabric, color, size_options
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (slug) DO NOTHING;
        `
        const values = [
          prod.name, prod.slug, prod.price, prod.discount_price, prod.description, prod.short_desc,
          prod.stock_count, prod.sku, prod.images, prod.category_id, prod.is_featured, prod.fabric, prod.color, prod.size_options
        ]
        await client.query(query, values)
      }
      console.log('Sample products seeded successfully!')
    } else {
      console.log(`Products table already has ${productCount} records. Skipping seeding.`);
    }

  } catch (err) {
    console.error('Database Operation Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
