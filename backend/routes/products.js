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
