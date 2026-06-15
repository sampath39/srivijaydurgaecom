require('dotenv').config();
const { Client } = require('pg');

const shirtBrands = ["Raymond", "Peter England", "Arrow", "Van Heusen", "Allen Solly", "Louis Philippe", "Zodiac", "Tommy Hilfiger", "U.S. Polo Assn.", "Levi's"];
const pantBrands = ["Levis", "Wrangler", "Pepe Jeans", "Flying Machine", "Spykar", "Lee", "Mufti", "Killer", "Blackberrys", "Celio"];

const shirtColors = ["White", "Black", "Navy Blue", "Sky Blue", "Maroon", "Olive Green", "Mustard Yellow", "Pink", "Grey", "Beige"];
const pantColors = ["Black", "Navy", "Khaki", "Grey", "Olive", "Brown", "Beige", "Charcoal", "Dark Blue"];

const shirtPatterns = ["Solid", "Striped", "Checked", "Printed", "Polka Dot", "Floral", "Abstract", "Textured"];
const pantPatterns = ["Solid", "Textured", "Checked", "Pinstripe"];

const shirtSizes = ["S", "M", "L", "XL", "XXL"];
const pantSizes = ["28", "30", "32", "34", "36", "38", "40", "42"];

const qualityTiers = ["Standard", "Premium", "Luxury", "Economy"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to DB to generate Shirts & Pants...");

  try {
    // 1. Get Categories IDs
    const { rows: cats } = await client.query("SELECT id, name FROM categories WHERE name IN ('Shirts', 'Pants')");
    let shirtsCatId = cats.find(c => c.name === 'Shirts')?.id;
    let pantsCatId = cats.find(c => c.name === 'Pants')?.id;

    if (!shirtsCatId || !pantsCatId) {
      console.log("Could not find categories for Shirts or Pants. Aborting.");
      return;
    }

    const productsToInsert = [];

    // Generate 100 Shirts
    for (let i = 0; i < 100; i++) {
      const brand = getRandomItem(shirtBrands);
      const color = getRandomItem(shirtColors);
      const pattern = getRandomItem(shirtPatterns);
      const tier = getRandomItem(qualityTiers);
      const name = `${brand} Men's ${color} ${pattern} Shirt`;
      
      const sizesArray = getRandomItems(shirtSizes, 3, 5);
      const availableColors = getRandomItems(shirtColors, 1, 3).join('/');
      
      const keyword = encodeURIComponent(`${pattern} ${color} shirt`);
      const imageUrl = `https://images.unsplash.com/featured/600x600?${keyword}&sig=${Math.floor(Math.random()*1000000)}`;

      const mrp = Math.floor(Math.random() * 2000) + 1000;
      const sell = Math.floor(mrp * (Math.random() * 0.4 + 0.4)); // 40-80% of MRP
      const stock = Math.floor(Math.random() * 40) + 10;
      
      const slug = toSlug(name) + '-' + Math.floor(Math.random()*100000);
      const sku = `SHRT-${Math.floor(Math.random()*90000)+10000}`;

      const desc = `Elevate your wardrobe with this stylish ${pattern} shirt by ${brand}. Made from premium fabric, offering a comfortable fit and a modern look. Quality Tier: ${tier}.`;

      productsToInsert.push([
        name, slug, brand, shirtsCatId, desc, `${tier} ${pattern} Shirt`,
        mrp, sell, stock, sku, [imageUrl], ["Casual Shirt", "Formal Shirt", pattern],
        true, false, availableColors, sizesArray, "Men's Shirts", tier
      ]);
    }

    // Generate 100 Pants
    for (let i = 0; i < 100; i++) {
      const brand = getRandomItem(pantBrands);
      const color = getRandomItem(pantColors);
      const pattern = getRandomItem(pantPatterns);
      const tier = getRandomItem(qualityTiers);
      const name = `${brand} Men's ${color} ${pattern} Trousers`;
      
      const sizesArray = getRandomItems(pantSizes, 4, 7);
      const availableColors = getRandomItems(pantColors, 1, 3).join('/');
      
      const keyword = encodeURIComponent(`${color} trousers pants`);
      const imageUrl = `https://images.unsplash.com/featured/600x600?${keyword}&sig=${Math.floor(Math.random()*1000000)}`;

      const mrp = Math.floor(Math.random() * 3000) + 1200;
      const sell = Math.floor(mrp * (Math.random() * 0.4 + 0.4));
      const stock = Math.floor(Math.random() * 40) + 10;
      
      const slug = toSlug(name) + '-' + Math.floor(Math.random()*100000);
      const sku = `PANT-${Math.floor(Math.random()*90000)+10000}`;

      const desc = `Classic ${pattern} trousers by ${brand}. Perfect for both formal and casual occasions. Enjoy unparalleled comfort and durability. Quality Tier: ${tier}.`;

      productsToInsert.push([
        name, slug, brand, pantsCatId, desc, `${tier} ${pattern} Trousers`,
        mrp, sell, stock, sku, [imageUrl], ["Trousers", "Formal Pants", pattern],
        true, false, availableColors, sizesArray, "Men's Pants", tier
      ]);
    }

    console.log(`Prepared ${productsToInsert.length} products. Inserting...`);

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
    `;

    let inserted = 0;
    for (const values of productsToInsert) {
      try {
        await client.query(query, values);
        inserted++;
      } catch (err) {
        console.error(`Error inserting ${values[0]}: ${err.message}`);
      }
    }

    console.log(`Successfully inserted ${inserted} items!`);

  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await client.end();
  }
}

run();
