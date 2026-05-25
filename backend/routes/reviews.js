const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// POST /api/reviews
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, rating, title, body } = req.body
    const { data, error } = await supabase.from('reviews')
      .upsert({ user_id: req.user.id, product_id, rating, title, body }, { onConflict: 'product_id,user_id' })
      .select('*, profiles(full_name, avatar_url)').single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/reviews/:product_id
router.get('/:product_id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('product_id', req.params.product_id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
