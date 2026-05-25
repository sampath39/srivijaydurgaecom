const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// GET /api/wishlist
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wishlists').select('*, products(id, name, slug, price, discount_price, images, avg_rating, stock_count)')
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/wishlist
router.post('/', auth, async (req, res) => {
  try {
    const { product_id } = req.body
    const { data: existing } = await supabase.from('wishlists')
      .select('id').eq('user_id', req.user.id).eq('product_id', product_id).single()
    if (existing) {
      await supabase.from('wishlists').delete().eq('id', existing.id)
      return res.json({ success: true, action: 'removed' })
    }
    const { data, error } = await supabase.from('wishlists')
      .insert({ user_id: req.user.id, product_id }).select().single()
    if (error) throw error
    res.json({ success: true, action: 'added', data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
