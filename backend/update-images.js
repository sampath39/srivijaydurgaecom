require('dotenv').config();
const { Client } = require('pg');

const productsData = [
  { brand: "Spaces", name: "Premium Cotton Towel", keyword: "bath towel" },
  { brand: "DDecor", name: "Soft Terry Towel", keyword: "terry towel" },
  { brand: "Urban Harvest", name: "Organic Cotton Face Towel", keyword: "face towel" },
  { brand: "HomeVerse", name: "Quick Dry Face Towel", keyword: "white face towel" },
  { brand: "Jalan/Welspun", name: "Luxury Hotel Towel", keyword: "hotel towel" },
  { brand: "Ghodawat", name: "Budget Hotel Towel", keyword: "folded towel" },
  { brand: "Sleepwell", name: "Soft Fiber Pillow", keyword: "pillow" },
  { brand: "Nilkamal", name: "Anti-Allergy Fiber Pillow", keyword: "white pillow" },
  { brand: "Wakefit", name: "Square Cushion", keyword: "square cushion" },
  { brand: "Springtek", name: "High Density Sponge", keyword: "bed pillow" },
  { brand: "SleepyCat", name: "Orthopedic Memory Foam", keyword: "memory foam pillow" },
  { brand: "Emma", name: "Cooling Gel Memory Foam", keyword: "cooling pillow" },
  { brand: "Rupa", name: "Pure Cotton Everyday Lungi", keyword: "lungi" },
  { brand: "Kairali", name: "Traditional Kerala Style", keyword: "kerala mundu" },
  { brand: "Lux Cozi", name: "Floral Printed", keyword: "floral fabric" },
  { brand: "VIP", name: "Formal Checked", keyword: "plaid fabric" },
  { brand: "Raymond", name: "Formal Office Plain", keyword: "white shirt" },
  { brand: "Peter England", name: "Summer Linen", keyword: "linen shirt" },
  { brand: "Roadster", name: "Slim Fit Korean Style", keyword: "korean shirt" },
  { brand: "Blackberrys", name: "Printed Party Shirt", keyword: "party shirt" },
  { brand: "Provogue", name: "Everyday Casual", keyword: "checked shirt" },
  { brand: "Raymond", name: "Premium Cotton Shirting", keyword: "cotton cloth" },
  { brand: "Siyaram", name: "Formal Shirting", keyword: "shirting cloth" },
  { brand: "Linen Club", name: "Linen Blend Shirting", keyword: "linen cloth" },
  { brand: "Grasim", name: "Budget Plain Cloth", keyword: "plain cloth" },
  { brand: "Raymond", name: "Wool Blend Trousers", keyword: "wool cloth" },
  { brand: "Siyaram", name: "Lycra Stretch Formal", keyword: "stretch fabric" },
  { brand: "Vimal", name: "Daily Wear Polywool", keyword: "polywool fabric" },
  { brand: "Arvind", name: "Summer Cotton Pant Cloth", keyword: "cotton pant cloth" },
  { brand: "Raymond Ready-to-Wear", name: "Checks Formal Set", keyword: "matching suit" },
  { brand: "Blackberrys", name: "Designer Party Set", keyword: "party wear suit" },
  { brand: "Linen Club", name: "Summer Linen Set", keyword: "linen suit set" },
  { brand: "Levis", name: "Ultra Flex Denim", keyword: "denim jeans" },
  { brand: "Wrangler", name: "Faded Slim", keyword: "slim jeans" },
  { brand: "Mufti", name: "Relaxed Fit", keyword: "relaxed jeans" },
  { brand: "Roadster", name: "Trendy Ripped", keyword: "ripped jeans" },
  { brand: "Peter England", name: "Chino Style", keyword: "chinos" },
  { brand: "Van Heusen", name: "Office Trouser", keyword: "office trousers" },
  { brand: "Puma", name: "Cotton Track Pant", keyword: "track pants" },
  { brand: "Jockey", name: "Casual Home Shorts", keyword: "cotton shorts" },
  { brand: "Nike", name: "Quick Dry Gym Shorts", keyword: "gym shorts" },
  { brand: "Decathlon", name: "Polyester Running", keyword: "running pants" },
  { brand: "Jockey", name: "Cotton Fleece", keyword: "fleece trackpants" },
  { brand: "US Polo", name: "Cotton Pique Polo", keyword: "polo shirt" },
  { brand: "Jockey", name: "Everyday Cotton Tee", keyword: "t-shirt" },
  { brand: "Roadster", name: "Streetwear Style", keyword: "oversized t-shirt" },
  { brand: "Souled Store", name: "Casual Printed", keyword: "graphic tee" },
  { brand: "Manyavar", name: "Daily Wear Kurtha", keyword: "cotton kurta" },
  { brand: "Manyavar", name: "Festive Silk Kurtha", keyword: "silk kurta" },
  { brand: "Manyavar", name: "Wedding Silk Pancha", keyword: "silk dhoti" },
  { brand: "Rangriti", name: "Royal Designer", keyword: "designer dhoti" },
  { brand: "Fabindia", name: "Festival Wear", keyword: "simple dhoti" },
  { brand: "Khadi Gramodyog", name: "Daily Wear", keyword: "cotton dhoti" },
  { brand: "Nalli", name: "School/College Wear", keyword: "colored border dhoti" },
  { brand: "Banarasi", name: "Banarasi Art Silk", keyword: "silk saree" },
  { brand: "Fabindia", name: "Daily Cotton", keyword: "cotton saree" },
  { brand: "Nalli", name: "Party Wear Net", keyword: "net saree" },
  { brand: "Sabyasachi", name: "Designer Bridal", keyword: "bridal saree" },
  { brand: "DDecor", name: "Eyelet Rings", keyword: "window curtains" },
  { brand: "Fabindia", name: "Thick Velvet", keyword: "door curtains" },
  { brand: "IKEA", name: "Voile Light", keyword: "sheer curtains" },
  { brand: "Sleepwell", name: "Room Darkening", keyword: "blackout curtains" },
  { brand: "Nilkamal", name: "Portable Cot", keyword: "folding bed" },
  { brand: "Wakefit", name: "Thick Foam Mattress", keyword: "foam mattress" },
  { brand: "Pepperfry", name: "Multi-purpose", keyword: "sofa bed" },
  { brand: "Spaces", name: "1-Piece Flat Sheet", keyword: "cotton bedsheet" },
  { brand: "Bombay Dyeing", name: "3-Piece Set", keyword: "bedsheet set" },
  { brand: "Raymond Home", name: "4-Piece Set", keyword: "king size bedsheet" },
  { brand: "DDecor", name: "2-Piece Set", keyword: "double bedsheet" },
  { brand: "Bombay Dyeing", name: "Light Summer", keyword: "cotton blanket" },
  { brand: "Sleepwell", name: "Thick Warm", keyword: "winter blanket" },
  { brand: "Raymond Home", name: "Decorative", keyword: "striped blanket" },
  { brand: "Furnishy", name: "Stretch Lycra", keyword: "sofa cover" },
  { brand: "Durfi", name: "Luxury Velvet", keyword: "velvet sofa" },
  { brand: "Springtek", name: "Designer", keyword: "jacquard sofa" },
  { brand: "3M", name: "Non-slip Coir", keyword: "door mat" },
  { brand: "HomeVerse", name: "Microfiber", keyword: "luxury door mat" },
  { brand: "Jockey", name: "Plain Set 12pcs", keyword: "handkerchief" },
  { brand: "Khadi Gramodyog", name: "Colorful Border 12pcs", keyword: "handkerchief set" },
  { brand: "Jockey", name: "Elastic Waist", keyword: "mens underwear" },
  { brand: "Jockey", name: "Vest Style", keyword: "mens vest" },
  { brand: "Milton", name: "Steel Vacuum Flask", keyword: "vacuum flask" },
  { brand: "Pigeon", name: "Copper Infused", keyword: "copper bottle" },
  { brand: "Dabur", name: "Raw Unprocessed", keyword: "raw honey" },
  { brand: "Girijan", name: "Organic Wild", keyword: "wild honey" },
  { brand: "Zandu", name: "Daily Use", keyword: "honey jar" },
  { brand: "Hamdard", name: "Summer Cooler", keyword: "sharbat" },
  { brand: "Hamdard", name: "Flavored", keyword: "rose sharbat" },
  { brand: "Dabur", name: "Ayurvedic", keyword: "ginger drink" },
  { brand: "Biotique", name: "Herbal Hair Care", keyword: "herbal shampoo" },
  { brand: "Himalaya", name: "Moisturizing", keyword: "aloe soap" },
  { brand: "Patanjali", name: "Anti-bacterial", keyword: "neem soap" },
  { brand: "HomeTown", name: "Decorative Sets", keyword: "curtain cover" },
  { brand: "Fabindia", name: "Embroidered", keyword: "cushion cover" },
  { brand: "Manyavar", name: "Combo Set", keyword: "traditional wear" },
  { brand: "Kalki", name: "Wedding Combo", keyword: "saree blouse" },
  { brand: "Jockey", name: "Cotton Regular", keyword: "mens briefs" },
  { brand: "Jockey", name: "Premium Cotton", keyword: "premium mens vest" }
];

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to DB to update images...");

  for (const p of productsData) {
    const randomId = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://images.unsplash.com/featured/600x600?${encodeURIComponent(p.keyword)}&sig=${randomId}`;
    
    // Find the product by name and brand
    const { rows } = await client.query(
      'SELECT id FROM public.products WHERE name = $1 AND brand = $2 LIMIT 1',
      [p.name, p.brand]
    );

    if (rows.length > 0) {
      await client.query(
        'UPDATE public.products SET images = $1 WHERE id = $2',
        [[imageUrl], rows[0].id]
      );
      console.log(`Updated images for ${p.name}`);
    } else {
      console.log(`Could not find ${p.name}`);
    }
  }

  await client.end();
  console.log("Finished updating images!");
}

run();
