const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// GET /api/cart
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carts')
      .select('*, products(id, name, slug, price, discount_price, images, stock_count)')
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/cart
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, quantity = 1, size = null } = req.body
    const { data, error } = await supabase
      .from('carts')
      .upsert({ user_id: req.user.id, product_id, quantity, size }, { onConflict: 'user_id,product_id,size' })
      .select('*, products(id, name, price, discount_price, images, stock_count)')
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/cart/:product_id
router.put('/:product_id', auth, async (req, res) => {
  try {
    const { quantity, size } = req.body
    const { data, error } = await supabase
      .from('carts')
      .update({ quantity })
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.product_id)
      .eq('size', size || null)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// DELETE /api/cart/:product_id
router.delete('/:product_id', auth, async (req, res) => {
  try {
    await supabase.from('carts')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.product_id)
    res.json({ success: true, message: 'Removed from cart' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// DELETE /api/cart
router.delete('/', auth, async (req, res) => {
  try {
    await supabase.from('carts').delete().eq('user_id', req.user.id)
    res.json({ success: true, message: 'Cart cleared' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
