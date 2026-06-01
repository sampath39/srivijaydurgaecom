const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const adminOnly = require('../middleware/adminOnly')
const supabase = require('../lib/supabase')

// GET /api/products — public list (active only)
router.get('/', async (req, res) => {
  try {
    const { category, search, sort = 'created_at', order = 'desc',
            page = 1, limit = 20, featured, flash_sale, min_price, max_price } = req.query

    let query = supabase
      .from('products')
      .select(category ? '*, categories!inner(name, slug)' : '*, categories(name, slug)', { count: 'exact' })
      .eq('is_active', true)

    if (category)    query = query.eq('categories.slug', category)
    if (featured)    query = query.eq('is_featured', true)
    if (flash_sale)  query = query.eq('is_flash_sale', true)
    if (min_price)   query = query.gte('price', min_price)
    if (max_price)   query = query.lte('price', max_price)
    if (search)      query = query.ilike('name', `%${search}%`)

    const sortMap = {
      price_asc:  ['price', { ascending: true }],
      price_desc: ['price', { ascending: false }],
      rating:     ['avg_rating', { ascending: false }],
      newest:     ['created_at', { ascending: false }],
      popular:    ['sold_count', { ascending: false }],
    }
    const [col, opts] = sortMap[sort] || ['created_at', { ascending: false }]
    query = query.order(col, opts)

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, count, error } = await query
    if (error) throw error

    res.json({ success: true, data, count, page: +page, limit: +limit, total_pages: Math.ceil(count / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/products/admin/all — admin: list ALL products (active + inactive)
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 15 } = req.query

    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })

    if (search) query = query.ilike('name', `%${search}%`)

    query = query.order('created_at', { ascending: false })

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, count, error } = await query
    if (error) throw error

    res.json({ success: true, data, count, page: +page, limit: +limit })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/products/admin/detail/:id — admin only
router.get('/admin/detail/:id', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, message: 'Product not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/products/admin/seed-defaults — admin only
router.post('/admin/seed-defaults', auth, adminOnly, async (req, res) => {
  try {
    // 1. Fetch categories
    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('id, slug')
    
    if (catErr) throw catErr

    const categories = {}
    catData.forEach(row => { categories[row.slug] = row.id })

    // 2. Define the static products with categories, prices, stock and beautiful Unsplash images
    const productsData = [
      { 
        slug: 'sarees', 
        name: 'Premium Kanchipuram Silk Saree', 
        desc: 'Handwoven pure silk saree with traditional gold zari border.', 
        price: 8999, 
        discount_price: 7599, 
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'sarees', 
        name: 'Banarasi Cotton Blend Saree', 
        desc: 'Lightweight and highly comfortable saree designed for festive wear.', 
        price: 4599, 
        discount_price: 3299, 
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'kadi-fabrics', 
        name: 'Authentic Handspun Kadi Fabric', 
        desc: '100% pure organic handspun kadi fabric sold by the meter.', 
        price: 899, 
        discount_price: 599, 
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'dress-materials', 
        name: 'Churidar Dress Material Unstitched', 
        desc: 'Beautiful embroidery patterns on premium cotton material.', 
        price: 2999, 
        discount_price: 1899, 
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'dupattas', 
        name: 'Designer Phulkari Dupatta', 
        desc: 'Vibrant ethnic colors and intricate embroidery thread work.', 
        price: 1499, 
        discount_price: 999, 
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'kurtas-sets', 
        name: 'Men\'s Festive Kurta Pajama Set', 
        desc: 'Comfortable fit, elegant ethnic wear for celebrations.', 
        price: 3499, 
        discount_price: 2499, 
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'kurtas-sets', 
        name: 'Women\'s A-Line Kurta Set', 
        desc: 'Breathable cotton kurta set paired with matching palazzo pants.', 
        price: 2899, 
        discount_price: 1999, 
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'bedsheets', 
        name: 'King Size Cotton Bedsheet', 
        desc: 'Includes 2 pillow covers. 300 Thread Count pure cotton.', 
        price: 2599, 
        discount_price: 1799, 
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'towels', 
        name: 'Luxury Bath Towel Set', 
        desc: 'Super absorbent, 100% organic cotton bath towels.', 
        price: 1299, 
        discount_price: 899, 
        image: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=600&q=80' 
      },
      { 
        slug: 'accessories', 
        name: 'Traditional Potli Bag', 
        desc: 'Beautifully handcrafted potli bag featuring detailed bead work.', 
        price: 999, 
        discount_price: 699, 
        image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80' 
      }
    ]

    const insertedProducts = []

    for (const p of productsData) {
      const catId = categories[p.slug]
      if (!catId) continue

      // Generate a unique slug
      const productSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000)

      const { data, error } = await supabase
        .from('products')
        .insert({
          category_id: catId,
          name: p.name,
          slug: productSlug,
          description: p.desc,
          price: p.price,
          discount_price: p.discount_price,
          stock_count: 50,
          is_featured: true,
          is_flash_sale: true,
          is_active: true,
          images: [p.image]
        })
        .select()
        .single()

      if (error) {
        console.error(`Error inserting ${p.name}:`, error.message)
      } else {
        insertedProducts.push(data)
      }
    }

    res.json({ success: true, count: insertedProducts.length, data: insertedProducts })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug), reviews(*, profiles(full_name, avatar_url))')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .single()
    if (error || !data) return res.status(404).json({ success: false, message: 'Product not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/products — admin only
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
    const { data, error } = await supabase
      .from('products')
      .insert({ ...req.body, slug })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PUT /api/products/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/products/:id — permanently deletes from DB
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Product permanently deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
