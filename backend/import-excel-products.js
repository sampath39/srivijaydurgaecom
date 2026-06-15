require('dotenv').config();
const { Client } = require('pg');
const xlsx = require('xlsx');
const path = require('path');

const categoryIcons = {
  "Towels": "🧺", "Pillows": "🛏️", "Lungi": "👖", "Shirts": "👕", "Shirt Cloth": "🧵",
  "Pant Cloth": "🧵", "Shirt Pant Bits": "🧵", "Jeans": "👖", "Pants": "👖", "Shorts": "🩳",
  "Track Pants": "🏃", "T-Shirts": "👕", "Kurthas": "👔", "Pattu Pancha": "👑", "Cotton Pancha": "👖",
  "Sarees": "🥻", "Curtains": "🪟", "Beds": "🛏️", "Bedsheets": "🛏️", "Blankets": "🛌",
  "Sofa Sets": "🛋️", "Door Mats": "🚪", "Handkerchiefs": "🤧", "Drawers": "🩲", "Banians": "🎽",
  "Bottles": "🍼", "Honey": "🍯", "Sharbat": "🥤", "Ayurvedic Products": "🌿", "Home Decor": "🏺",
  "Traditional Wear": "👘", "Innerwear": "🩲", "Footwear": "👟", "Kitchen": "🍳", "Electronics": "🔌",
  "Kids Wear": "👶"
};

const categoryImages = {
  "Towels": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
  "Pillows": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80",
  "Lungi": "https://images.unsplash.com/photo-1622359419139-3d12d52579df?w=600&auto=format&fit=crop&q=80",
  "Shirts": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
  "Shirt Cloth": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
  "Pant Cloth": "https://images.unsplash.com/photo-1528148967406-8dce49372bd1?w=600&auto=format&fit=crop&q=80",
  "Shirt Pant Bits": "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=600&auto=format&fit=crop&q=80",
  "Jeans": "https://images.unsplash.com/photo-1542272604-780287103f19?w=600&auto=format&fit=crop&q=80",
  "Pants": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
  "Shorts": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80",
  "Track Pants": "https://images.unsplash.com/photo-1610385966952-094ee73d6b0a?w=600&auto=format&fit=crop&q=80",
  "T-Shirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
  "Kurthas": "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&auto=format&fit=crop&q=80",
  "Pattu Pancha": "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&auto=format&fit=crop&q=80",
  "Cotton Pancha": "https://images.unsplash.com/photo-1622359419139-3d12d52579df?w=600&auto=format&fit=crop&q=80",
  "Sarees": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
  "Curtains": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
  "Beds": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80",
  "Bedsheets": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80",
  "Blankets": "https://images.unsplash.com/photo-1600863071372-fb5fc11c1d43?w=600&auto=format&fit=crop&q=80",
  "Sofa Sets": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
  "Door Mats": "https://images.unsplash.com/photo-1582068997283-f6617dd9485b?w=600&auto=format&fit=crop&q=80",
  "Handkerchiefs": "https://images.unsplash.com/photo-1621077759868-6c8a77a9a130?w=600&auto=format&fit=crop&q=80",
  "Drawers": "https://images.unsplash.com/photo-1584285408479-0dbcc7e6da80?w=600&auto=format&fit=crop&q=80",
  "Banians": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
  "Bottles": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
  "Honey": "https://images.unsplash.com/photo-1587049352847-4d436a5b4fdf?w=600&auto=format&fit=crop&q=80",
  "Sharbat": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
  "Ayurvedic Products": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80",
  "Home Decor": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
  "Traditional Wear": "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&auto=format&fit=crop&q=80",
  "Innerwear": "https://images.unsplash.com/photo-1584285408479-0dbcc7e6da80?w=600&auto=format&fit=crop&q=80",
  "Footwear": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
  "Kitchen": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80",
  "Electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80",
  "Kids Wear": "https://images.unsplash.com/photo-1519238396253-3c5821c13bc5?w=600&auto=format&fit=crop&q=80"
};

function toSlug(str) {
  if (!str) return 'product';
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  const filePath = path.join(__dirname, '..', 'product_master_3500.xlsx');
  console.log(`Loading Excel file: ${filePath}`);
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  console.log(`Parsed ${data.length} rows from Excel.`);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  client.on('error', err => {
    console.error('Unexpected DB client error:', err.message);
  });
  await client.connect();
  console.log("Connected to DB.");

  try {
    console.log("Ensuring categories exist...");
    const uniqueCategories = [...new Set(data.map(p => p['Main Category']).filter(Boolean))];
    const catMap = {}; // name -> id

    // Fetch existing
    const { rows: existingCats } = await client.query('SELECT id, name FROM public.categories');
    existingCats.forEach(c => { catMap[c.name] = c.id; });

    // Insert new
    for (const catName of uniqueCategories) {
      if (!catMap[catName]) {
        const slug = toSlug(catName);
        const icon = categoryIcons[catName] || '🏷️';
        const query = `
          INSERT INTO public.categories (name, slug, description, icon, is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `;
        const res = await client.query(query, [catName, slug, `Explore our collection of ${catName}`, icon, true]);
        catMap[catName] = res.rows[0].id;
        console.log(`Created new category: ${catName}`);
      }
    }

    console.log("Fetching existing SKUs to avoid duplicates...");
    const { rows: existingProducts } = await client.query('SELECT sku FROM public.products WHERE sku IS NOT NULL');
    const existingSkus = new Set(existingProducts.map(p => p.sku));
    console.log(`Found ${existingSkus.size} existing SKUs.`);

    console.log("Processing products in batches...");
    const batchSize = 100;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      console.log(`Inserting batch ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)}...`);

      for (const p of batch) {
        if (!p['Product Name'] || !p['Main Category']) continue;

        const categoryId = catMap[p['Main Category']];
        const baseSlug = toSlug(p['Product Name'] + '-' + p['Brand']);
        const slug = baseSlug + '-' + Math.floor(Math.random() * 100000); // Unique slug
        
        let sizesArray = [];
        if (p['Sizes'] && p['Sizes'] !== 'N/A') {
          sizesArray = String(p['Sizes']).split(',').map(s => s.trim());
        }

        const image = categoryImages[p['Main Category']] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80';
        
        const shortDesc = `${p['Quality Tier']} quality ${p['Subcategory']} by ${p['Brand']}.`;
        const desc = `Experience the finest quality with this ${p['Design']} design ${p['Product Name']} from ${p['Brand']}. This belongs to our ${p['Subcategory']} collection and is categorized as a ${p['Quality Tier']} tier product. Available in beautiful colors (${p['Colors']}) to match your style. High quality, durable, and designed for customer satisfaction.`;

        const sku = p['Product ID'] || `${p['Main Category'].substring(0,3).toUpperCase()}-${Math.floor(Math.random()*90000)+10000}`;
        if (existingSkus.has(sku)) {
          continue; // Skip already inserted
        }

        const stockCount = Math.floor(Math.random() * 11) + 10; // Random between 10-20
        
        const tags = [p['Subcategory'], p['Quality Tier'], p['Design']].filter(Boolean);

        const mrp = parseFloat(p['MRP (₹)']) || 0;
        const sellPrice = parseFloat(p['Selling Price (₹)']) || mrp;

        const query = `
          INSERT INTO public.products (
            name, slug, brand, category_id, description, short_desc,
            price, discount_price, stock_count, sku, images, tags,
            is_active, is_featured, color, size_options, subcategory, quality_tier
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17, $18
          )
          ON CONFLICT (slug) DO NOTHING;
        `;

        const values = [
          p['Product Name'], slug, p['Brand'], categoryId, desc, shortDesc,
          mrp, sellPrice, stockCount, sku, [image], tags,
          true, false, p['Colors'], sizesArray, p['Subcategory'], p['Quality Tier']
        ];

        try {
          await client.query(query, values);
          insertedCount++;
        } catch (err) {
          // If SKU conflict, that's fine, we skip or handle. Actually schema has SKU unique.
          if (err.constraint === 'products_sku_key') {
            // Already inserted
          } else {
             console.error(`Failed to insert ${p['Product Name']} (SKU: ${sku}): `, err.message);
             errorCount++;
          }
        }
      }
    }

    console.log(`\nImport Summary:`);
    console.log(`Successfully inserted: ${insertedCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (err) {
    console.error("Error during import:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

run();
