require('dotenv').config();
const { Client } = require('pg');

const productsData = [
  { main: "Towels", sub: "Bath Towels", brand: "Spaces", name: "Premium Cotton Towel", tier: "Premium", colors: "White/Grey/Blue/Teal", sizes: "Big", sell: 399, mrp: 1399 },
  { main: "Towels", sub: "Bath Towels", brand: "DDecor", name: "Soft Terry Towel", tier: "Standard", colors: "Pink/Green/Yellow/Lavender", sizes: "Medium", sell: 299, mrp: 899 },
  { main: "Towels", sub: "Face Towels", brand: "Urban Harvest", name: "Organic Cotton Face Towel", tier: "Premium", colors: "Multi-color pack", sizes: "Small", sell: 199, mrp: 499 },
  { main: "Towels", sub: "Face Towels", brand: "HomeVerse", name: "Quick Dry Face Towel", tier: "Economy", colors: "White/Cream/Beige", sizes: "Small", sell: 145, mrp: 299 },
  { main: "Towels", sub: "Hotel Towels", brand: "Jalan/Welspun", name: "Luxury Hotel Towel", tier: "Luxury", colors: "White", sizes: "Big", sell: 399, mrp: 1299 },
  { main: "Towels", sub: "Hotel Towels", brand: "Ghodawat", name: "Budget Hotel Towel", tier: "Standard", colors: "White/Beige/Grey", sizes: "Medium", sell: 250, mrp: 599 },
  { main: "Pillows", sub: "Fiber Pillow", brand: "Sleepwell", name: "Soft Fiber Pillow", tier: "Standard", colors: "White", sizes: "Standard", sell: 399, mrp: 799 },
  { main: "Pillows", sub: "Fiber Pillow", brand: "Nilkamal", name: "Anti-Allergy Fiber Pillow", tier: "Premium", colors: "White", sizes: "Large", sell: 600, mrp: 1200 },
  { main: "Pillows", sub: "Cushion", brand: "Wakefit", name: "Square Cushion", tier: "Economy", colors: "Red/Blue/Green/Yellow", sizes: "Small Pair", sell: 175, mrp: 249 },
  { main: "Pillows", sub: "Sponge Pillow", brand: "Springtek", name: "High Density Sponge", tier: "Premium", colors: "White", sizes: "XL", sell: 800, mrp: 1600 },
  { main: "Pillows", sub: "Memory Foam", brand: "SleepyCat", name: "Orthopedic Memory Foam", tier: "Luxury", colors: "White/Grey", sizes: "Standard", sell: 1400, mrp: 2400 },
  { main: "Pillows", sub: "Memory Foam", brand: "Emma", name: "Cooling Gel Memory Foam", tier: "Luxury", colors: "White", sizes: "Large", sell: 1300, mrp: 2300 },
  { main: "Lungi", sub: "Cotton Lungi", brand: "Rupa", name: "Pure Cotton Everyday Lungi", tier: "Standard", colors: "10 colors", sizes: "Free Size", sell: 275, mrp: 399 },
  { main: "Lungi", sub: "Kerala Lungi", brand: "Kairali", name: "Traditional Kerala Style", tier: "Premium", colors: "White/Gold border", sizes: "Free Size", sell: 399, mrp: 599 },
  { main: "Lungi", sub: "Printed Lungi", brand: "Lux Cozi", name: "Floral Printed", tier: "Standard", colors: "Multi", sizes: "Free Size", sell: 299, mrp: 449 },
  { main: "Lungi", sub: "Checked Lungi", brand: "VIP", name: "Formal Checked", tier: "Standard", colors: "Blue/Black/Red/Green", sizes: "Free Size", sell: 275, mrp: 399 },
  { main: "Shirts", sub: "Plain Shirt", brand: "Raymond", name: "Formal Office Plain", tier: "Standard", colors: "White/Black/Blue/Grey", sizes: "M,L,XL,XXL", sell: 799, mrp: 1299 },
  { main: "Shirts", sub: "Linen Shirt", brand: "Peter England", name: "Summer Linen", tier: "Premium", colors: "Beige/Sky Blue/Mint/Cream", sizes: "M,L,XL,XXL", sell: 1499, mrp: 2499 },
  { main: "Shirts", sub: "Korean Shirt", brand: "Roadster", name: "Slim Fit Korean Style", tier: "Standard", colors: "8 colors", sizes: "M,L,XL,XXL", sell: 999, mrp: 1599 },
  { main: "Shirts", sub: "Party Wear Shirt", brand: "Blackberrys", name: "Printed Party Shirt", tier: "Premium", colors: "Black/Gold/Maroon/Navy", sizes: "M,L,XL,XXL", sell: 1999, mrp: 2999 },
  { main: "Shirts", sub: "Casual Checked Shirt", brand: "Provogue", name: "Everyday Casual", tier: "Economy", colors: "Red/Black/Blue/White/Green", sizes: "M,L,XL,XXL", sell: 500, mrp: 799 },
  { main: "Shirt Cloth", sub: "Shirting", brand: "Raymond", name: "Premium Cotton Shirting", tier: "Luxury", colors: "20+ shades", sizes: "Per Meter", sell: 2000, mrp: 3000 },
  { main: "Shirt Cloth", sub: "Shirting", brand: "Siyaram", name: "Formal Shirting", tier: "Premium", colors: "15+ shades", sizes: "Per Meter", sell: 1200, mrp: 2200 },
  { main: "Shirt Cloth", sub: "Shirting", brand: "Linen Club", name: "Linen Blend Shirting", tier: "Premium", colors: "10 shades", sizes: "Per Meter", sell: 1500, mrp: 2500 },
  { main: "Shirt Cloth", sub: "Shirting", brand: "Grasim", name: "Budget Plain Cloth", tier: "Economy", colors: "12 shades", sizes: "Per Meter", sell: 399, mrp: 1399 },
  { main: "Pant Cloth", sub: "Trouser Cloth", brand: "Raymond", name: "Wool Blend Trousers", tier: "Luxury", colors: "Black/Grey/Navy/Charcoal", sizes: "Per Meter", sell: 2499, mrp: 3499 },
  { main: "Pant Cloth", sub: "Trouser Cloth", brand: "Siyaram", name: "Lycra Stretch Formal", tier: "Premium", colors: "8 shades", sizes: "Per Meter", sell: 1800, mrp: 2800 },
  { main: "Pant Cloth", sub: "Trouser Cloth", brand: "Vimal", name: "Daily Wear Polywool", tier: "Standard", colors: "10 shades", sizes: "Per Meter", sell: 999, mrp: 1999 },
  { main: "Pant Cloth", sub: "Trouser Cloth", brand: "Arvind", name: "Summer Cotton Pant Cloth", tier: "Standard", colors: "6 shades", sizes: "Per Meter", sell: 899, mrp: 1899 },
  { main: "Shirt Pant Bits", sub: "Matching Set", brand: "Raymond Ready-to-Wear", name: "Checks Formal Set", tier: "Standard", colors: "Blue/Grey/Green", sizes: "Full Set", sell: 999, mrp: 1999 },
  { main: "Shirt Pant Bits", sub: "Matching Set", brand: "Blackberrys", name: "Designer Party Set", tier: "Premium", colors: "Maroon/Gold/Black/Silver", sizes: "Full Set", sell: 1999, mrp: 2999 },
  { main: "Shirt Pant Bits", sub: "Matching Set", brand: "Linen Club", name: "Summer Linen Set", tier: "Premium", colors: "Beige/Cream/Mint/White", sizes: "Full Set", sell: 1499, mrp: 2499 },
  { main: "Jeans", sub: "Stretch Jeans", brand: "Levis", name: "Ultra Flex Denim", tier: "Premium", colors: "Blue/Black/Grey", sizes: "M,L,XL,XXL,XXXL", sell: 1499, mrp: 2499 },
  { main: "Jeans", sub: "Slim Fit Jeans", brand: "Wrangler", name: "Faded Slim", tier: "Standard", colors: "Light Blue/Grey/Black", sizes: "M,L,XL,XXL,XXXL", sell: 999, mrp: 1799 },
  { main: "Jeans", sub: "Casual Jeans", brand: "Mufti", name: "Relaxed Fit", tier: "Economy", colors: "Dark Blue/Black", sizes: "M,L,XL,XXL,XXXL", sell: 799, mrp: 1799 },
  { main: "Jeans", sub: "Ripped Jeans", brand: "Roadster", name: "Trendy Ripped", tier: "Standard", colors: "Blue/Black/Grey", sizes: "M,L,XL,XXL,XXXL", sell: 1299, mrp: 2299 },
  { main: "Pants", sub: "Cotton Pants", brand: "Peter England", name: "Chino Style", tier: "Standard", colors: "Khaki/Navy/Olive/Beige", sizes: "M,L,XL,XXL,XXXL", sell: 899, mrp: 1699 },
  { main: "Pants", sub: "Formal Pants", brand: "Van Heusen", name: "Office Trouser", tier: "Standard", colors: "Black/Grey/Navy/Brown", sizes: "M,L,XL,XXL,XXXL", sell: 1299, mrp: 2299 },
  { main: "Pants", sub: "Track Pants", brand: "Puma", name: "Cotton Track Pant", tier: "Economy", colors: "Grey/Black/Blue/Navy", sizes: "M,L,XL,XXL", sell: 599, mrp: 1599 },
  { main: "Shorts", sub: "Cotton Shorts", brand: "Jockey", name: "Casual Home Shorts", tier: "Economy", colors: "6 colors", sizes: "M,L,XL", sell: 399, mrp: 1399 },
  { main: "Shorts", sub: "Sports Shorts", brand: "Nike", name: "Quick Dry Gym Shorts", tier: "Standard", colors: "8 colors", sizes: "M,L,XL", sell: 599, mrp: 1599 },
  { main: "Track Pants", sub: "Sports Track", brand: "Decathlon", name: "Polyester Running", tier: "Standard", colors: "10 colors", sizes: "M,L,XL,XXL", sell: 699, mrp: 1699 },
  { main: "Track Pants", sub: "Casual Track", brand: "Jockey", name: "Cotton Fleece", tier: "Economy", colors: "Grey/Navy/Black/Maroon", sizes: "M,L,XL,XXL", sell: 599, mrp: 1599 },
  { main: "T-Shirts", sub: "Polo T-Shirt", brand: "US Polo", name: "Cotton Pique Polo", tier: "Standard", colors: "12 colors", sizes: "M,L,XL,XXL", sell: 599, mrp: 1299 },
  { main: "T-Shirts", sub: "Round Neck", brand: "Jockey", name: "Everyday Cotton Tee", tier: "Economy", colors: "15 colors", sizes: "M,L,XL,XXL", sell: 399, mrp: 699 },
  { main: "T-Shirts", sub: "Oversized T-Shirt", brand: "Roadster", name: "Streetwear Style", tier: "Standard", colors: "10 colors", sizes: "M,L,XL,XXL", sell: 699, mrp: 1699 },
  { main: "T-Shirts", sub: "Graphic Print Tee", brand: "Souled Store", name: "Casual Printed", tier: "Standard", colors: "Multi", sizes: "M,L,XL,XXL", sell: 499, mrp: 999 },
  { main: "Kurthas", sub: "Cotton Kurtha", brand: "Manyavar", name: "Daily Wear Kurtha", tier: "Standard", colors: "White/Cream/Blue/Beige", sizes: "M,L,XL,XXL", sell: 699, mrp: 999 },
  { main: "Kurthas", sub: "Pattu Kurtha", brand: "Manyavar", name: "Festive Silk Kurtha", tier: "Premium", colors: "Maroon/Green/Gold/Royal Blue", sizes: "M,L,XL,XXL", sell: 999, mrp: 1999 },
  { main: "Pattu Pancha", sub: "Traditional", brand: "Manyavar", name: "Wedding Silk Pancha", tier: "Luxury", colors: "Cream/Gold/White/Silver", sizes: "Free Size", sell: 5000, mrp: 8000 },
  { main: "Pattu Pancha", sub: "Maharaja Style", brand: "Rangriti", name: "Royal Designer", tier: "Luxury", colors: "Multi-color", sizes: "Free Size", sell: 9999, mrp: 14999 },
  { main: "Pattu Pancha", sub: "Simple Pattu", brand: "Fabindia", name: "Festival Wear", tier: "Premium", colors: "Off-white/Gold/Cream", sizes: "Free Size", sell: 2500, mrp: 3999 },
  { main: "Cotton Pancha", sub: "Pure Cotton", brand: "Khadi Gramodyog", name: "Daily Wear", tier: "Standard", colors: "White/Cream", sizes: "Free Size", sell: 399, mrp: 699 },
  { main: "Cotton Pancha", sub: "Colored Border", brand: "Nalli", name: "School/College Wear", tier: "Economy", colors: "White/Blue/White/Green", sizes: "Free Size", sell: 499, mrp: 899 },
  { main: "Sarees", sub: "Silk Saree", brand: "Banarasi", name: "Banarasi Art Silk", tier: "Premium", colors: "20+ colors", sizes: "Free Size", sell: 3999, mrp: 6999 },
  { main: "Sarees", sub: "Cotton Saree", brand: "Fabindia", name: "Daily Cotton", tier: "Standard", colors: "30+ colors", sizes: "Free Size", sell: 999, mrp: 1999 },
  { main: "Sarees", sub: "Fancy Saree", brand: "Nalli", name: "Party Wear Net", tier: "Standard", colors: "25+ colors", sizes: "Free Size", sell: 1999, mrp: 3999 },
  { main: "Sarees", sub: "Wedding Saree", brand: "Sabyasachi", name: "Designer Bridal", tier: "Luxury", colors: "Red/Maroon/Pink/Gold", sizes: "Free Size", sell: 6999, mrp: 9999 },
  { main: "Curtains", sub: "Window Curtains", brand: "DDecor", name: "Eyelet Rings", tier: "Standard", colors: "15 colors", sizes: "Window", sell: 599, mrp: 1299 },
  { main: "Curtains", sub: "Door Curtains", brand: "Fabindia", name: "Thick Velvet", tier: "Premium", colors: "10 colors", sizes: "Door", sell: 1299, mrp: 2299 },
  { main: "Curtains", sub: "Sheer Curtains", brand: "IKEA", name: "Voile Light", tier: "Economy", colors: "White/Cream/Beige", sizes: "Window", sell: 499, mrp: 799 },
  { main: "Curtains", sub: "Blackout Curtains", brand: "Sleepwell", name: "Room Darkening", tier: "Premium", colors: "8 colors", sizes: "XL", sell: 999, mrp: 1999 },
  { main: "Beds", sub: "Foldable Bed", brand: "Nilkamal", name: "Portable Cot", tier: "Standard", colors: "Brown/Grey", sizes: "2x6", sell: 999, mrp: 1999 },
  { main: "Beds", sub: "Foam Bed", brand: "Wakefit", name: "Thick Foam Mattress", tier: "Premium", colors: "White", sizes: "Single", sell: 2499, mrp: 3499 },
  { main: "Beds", sub: "Floor Sofa Bed", brand: "Pepperfry", name: "Multi-purpose", tier: "Standard", colors: "Grey/Blue/Beige", sizes: "Large", sell: 1999, mrp: 2999 },
  { main: "Bedsheets", sub: "Cotton Bedsheet", brand: "Spaces", name: "1-Piece Flat Sheet", tier: "Standard", colors: "20+ prints", sizes: "4x6", sell: 699, mrp: 1299 },
  { main: "Bedsheets", sub: "Premium Bedsheet", brand: "Bombay Dyeing", name: "3-Piece Set", tier: "Premium", colors: "30+ designs", sizes: "5x6,6x6", sell: 1499, mrp: 2999 },
  { main: "Bedsheets", sub: "King Size Bedsheet", brand: "Raymond Home", name: "4-Piece Set", tier: "Luxury", colors: "15 colors", sizes: "8x8", sell: 2499, mrp: 3499 },
  { main: "Bedsheets", sub: "Double Bed Bedsheet", brand: "DDecor", name: "2-Piece Set", tier: "Economy", colors: "20 prints", sizes: "3x6", sell: 899, mrp: 1599 },
  { main: "Blankets", sub: "Cotton Blanket", brand: "Bombay Dyeing", name: "Light Summer", tier: "Standard", colors: "8 colors", sizes: "Single", sell: 399, mrp: 799 },
  { main: "Blankets", sub: "Winter Blanket", brand: "Sleepwell", name: "Thick Warm", tier: "Premium", colors: "6 colors", sizes: "Double", sell: 899, mrp: 1799 },
  { main: "Blankets", sub: "Stripe Blanket", brand: "Raymond Home", name: "Decorative", tier: "Standard", colors: "Multi stripe", sizes: "King", sell: 699, mrp: 1299 },
  { main: "Sofa Sets", sub: "Sofa Covers", brand: "Furnishy", name: "Stretch Lycra", tier: "Standard", colors: "20 colors", sizes: "5 Seater", sell: 999, mrp: 1999 },
  { main: "Sofa Sets", sub: "Velvet Sofa Set", brand: "Durfi", name: "Luxury Velvet", tier: "Premium", colors: "10 colors", sizes: "7 Seater", sell: 2499, mrp: 3999 },
  { main: "Sofa Sets", sub: "Jacquard Sofa Set", brand: "Springtek", name: "Designer", tier: "Premium", colors: "12 designs", sizes: "10pcs", sell: 299, mrp: 3999 },
  { main: "Door Mats", sub: "Soft Mats", brand: "3M", name: "Non-slip Coir", tier: "Standard", colors: "Multi", sizes: "Small", sell: 99, mrp: 299 },
  { main: "Door Mats", sub: "Luxury Mats", brand: "HomeVerse", name: "Microfiber", tier: "Premium", colors: "6 colors", sizes: "Large", sell: 299, mrp: 499 },
  { main: "Handkerchiefs", sub: "Cotton Kerchief", brand: "Jockey", name: "Plain Set 12pcs", tier: "Economy", colors: "White/Cream", sizes: "12 Pieces Set", sell: 400, mrp: 900 },
  { main: "Handkerchiefs", sub: "Handloom Set", brand: "Khadi Gramodyog", name: "Colorful Border 12pcs", tier: "Standard", colors: "Assorted", sizes: "12 Pieces Set", sell: 599, mrp: 1299 },
  { main: "Drawers", sub: "Cotton Drawers", brand: "Jockey", name: "Elastic Waist", tier: "Standard", colors: "White/Grey", sizes: "80,85,90,95,100", sell: 199, mrp: 399 },
  { main: "Banians", sub: "Cotton Banians", brand: "Jockey", name: "Vest Style", tier: "Standard", colors: "White", sizes: "80,85,90,95,100", sell: 199, mrp: 399 },
  { main: "Bottles", sub: "Kangaroo Bottle", brand: "Milton", name: "Steel Vacuum Flask", tier: "Standard", colors: "5 colors", sizes: "500ml,750ml,1L", sell: 150, mrp: 299 },
  { main: "Bottles", sub: "Steel Bottle", brand: "Pigeon", name: "Copper Infused", tier: "Premium", colors: "4 colors", sizes: "750ml,1L", sell: 199, mrp: 399 },
  { main: "Honey", sub: "Forest Honey", brand: "Dabur", name: "Raw Unprocessed", tier: "Premium", colors: "N/A", sizes: "500ml", sell: 399, mrp: 799 },
  { main: "Honey", sub: "Girijan Honey", brand: "Girijan", name: "Organic Wild", tier: "Premium", colors: "N/A", sizes: "1 Liter", sell: 699, mrp: 1199 },
  { main: "Honey", sub: "Small Pack Honey", brand: "Zandu", name: "Daily Use", tier: "Economy", colors: "N/A", sizes: "100ml", sell: 120, mrp: 299 },
  { main: "Sharbat", sub: "Nannari Sharbat", brand: "Hamdard", name: "Summer Cooler", tier: "Standard", colors: "N/A", sizes: "750ml", sell: 299, mrp: 499 },
  { main: "Sharbat", sub: "Rose Sharbat", brand: "Hamdard", name: "Flavored", tier: "Standard", colors: "N/A", sizes: "1 Liter", sell: 399, mrp: 699 },
  { main: "Sharbat", sub: "Ginger Sharbat", brand: "Dabur", name: "Ayurvedic", tier: "Premium", colors: "N/A", sizes: "750ml", sell: 350, mrp: 599 },
  { main: "Ayurvedic Products", sub: "Shampoo", brand: "Biotique", name: "Herbal Hair Care", tier: "Standard", colors: "N/A", sizes: "250ml", sell: 299, mrp: 599 },
  { main: "Ayurvedic Products", sub: "Aloe Soap", brand: "Himalaya", name: "Moisturizing", tier: "Standard", colors: "Green", sizes: "5pcs set", sell: 399, mrp: 799 },
  { main: "Ayurvedic Products", sub: "Neem Soap", brand: "Patanjali", name: "Anti-bacterial", tier: "Economy", colors: "Green", sizes: "Single", sell: 299, mrp: 599 },
  { main: "Home Decor", sub: "Curtains Covers", brand: "HomeTown", name: "Decorative Sets", tier: "Standard", colors: "Multi", sizes: "Standard", sell: 999, mrp: 1999 },
  { main: "Home Decor", sub: "Cushion Covers", brand: "Fabindia", name: "Embroidered", tier: "Premium", colors: "15 designs", sizes: "Standard", sell: 299, mrp: 699 },
  { main: "Traditional Wear", sub: "Pancha Kurtha", brand: "Manyavar", name: "Combo Set", tier: "Premium", colors: "Cream/Gold/White", sizes: "Free Size,M,L,XL,XXL", sell: 1499, mrp: 2499 },
  { main: "Traditional Wear", sub: "Silk Saree Blouse", brand: "Kalki", name: "Wedding Combo", tier: "Luxury", colors: "10 shades", sizes: "Free Size", sell: 7999, mrp: 12999 },
  { main: "Innerwear", sub: "Drawers", brand: "Jockey", name: "Cotton Regular", tier: "Economy", colors: "White/Grey", sizes: "80,85,90,95,100", sell: 199, mrp: 399 },
  { main: "Innerwear", sub: "Banians", brand: "Jockey", name: "Premium Cotton", tier: "Standard", colors: "White", sizes: "80,85,90,95,100", sell: 299, mrp: 599 }
];

const categoryIcons = {
  "Towels": "🧺",
  "Pillows": "🛏️",
  "Lungi": "👖",
  "Shirts": "👕",
  "Shirt Cloth": "🧵",
  "Pant Cloth": "🧵",
  "Shirt Pant Bits": "🧵",
  "Jeans": "👖",
  "Pants": "👖",
  "Shorts": "🩳",
  "Track Pants": "🏃",
  "T-Shirts": "👕",
  "Kurthas": "👔",
  "Pattu Pancha": "👑",
  "Cotton Pancha": "👖",
  "Sarees": "🥻",
  "Curtains": "🪟",
  "Beds": "🛏️",
  "Bedsheets": "🛏️",
  "Blankets": "🛌",
  "Sofa Sets": "🛋️",
  "Door Mats": "🚪",
  "Handkerchiefs": "🤧",
  "Drawers": "🩲",
  "Banians": "🎽",
  "Bottles": "🍼",
  "Honey": "🍯",
  "Sharbat": "🥤",
  "Ayurvedic Products": "🌿",
  "Home Decor": "🏺",
  "Traditional Wear": "👘",
  "Innerwear": "🩲"
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
  "Innerwear": "https://images.unsplash.com/photo-1584285408479-0dbcc7e6da80?w=600&auto=format&fit=crop&q=80"
};

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to DB.");

  try {
    // 1. Add new columns to products table if they don't exist
    console.log("Checking schema for subcategory and quality_tier...");
    await client.query(`
      ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS subcategory TEXT,
      ADD COLUMN IF NOT EXISTS quality_tier TEXT;
    `);
    console.log("Schema is up to date.");

    // 2. Fetch or create all Main Categories
    console.log("Processing categories...");
    const uniqueCategories = [...new Set(productsData.map(p => p.main))];
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

    // 3. Process and Insert Products
    console.log("Processing products...");
    let inserted = 0;
    
    for (const p of productsData) {
      const categoryId = catMap[p.main];
      const baseSlug = toSlug(p.name + '-' + p.brand);
      // Ensure unique slug
      const slug = baseSlug + '-' + Math.floor(Math.random() * 10000);
      
      const sizesArray = p.sizes !== 'N/A' ? p.sizes.split(',').map(s => s.trim()) : [];
      const image = categoryImages[p.main] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80';
      
      const shortDesc = `${p.tier} quality ${p.sub} by ${p.brand}.`;
      const desc = `Experience the finest quality with this ${p.name} from ${p.brand}. This belongs to our ${p.sub} collection and is categorized as a ${p.tier} tier product. Available in beautiful colors (${p.colors}) to match your style. High quality, durable, and designed for customer satisfaction.`;

      const sku = `${p.main.substring(0,3).toUpperCase()}-${p.sub.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*9000)+1000}`;

      const stockCount = Math.floor(Math.random() * 11) + 10;

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

      const values = [
        p.name, slug, p.brand, categoryId, desc, shortDesc,
        p.mrp, p.sell, stockCount, sku, [image], [p.sub, p.tier],
        true, false, p.colors, sizesArray, p.sub, p.tier
      ];

      try {
        await client.query(query, values);
        inserted++;
      } catch (err) {
        console.error(`Failed to insert ${p.name}: `, err.message);
      }
    }

    console.log(`Successfully inserted ${inserted} products!`);

  } catch (err) {
    console.error("Error during import:", err);
  } finally {
    await client.end();
  }
}

run();
