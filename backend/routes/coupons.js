const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const adminOnly = require('../middleware/adminOnly')
const supabase = require('../lib/supabase')

// POST /api/coupons/validate
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, cart_total } = req.body
    const { data: coupon } = await supabase.from('coupons')
      .select('*').eq('code', code.toUpperCase()).eq('is_active', true).single()
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' })
    if (coupon.user_id && coupon.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'This coupon is not valid for your account' })
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return res.status(400).json({ success: false, message: 'Coupon has expired' })
    if (coupon.used_count >= coupon.usage_limit)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' })
    if (cart_total < coupon.min_order_value)
      return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.min_order_value} required` })

    const discount = coupon.type === 'percentage'
      ? Math.min((cart_total * coupon.value) / 100, coupon.max_discount || Infinity)
      : coupon.value

    res.json({ success: true, coupon, discount: Math.round(discount) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/coupons — admin
router.get('/', auth, adminOnly, async (_req, res) => {
  try {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/coupons — admin
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').insert({
      ...req.body, code: req.body.code.toUpperCase()
    }).select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// DELETE /api/coupons/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('coupons').update({ is_active: false }).eq('id', req.params.id)
    res.json({ success: true, message: 'Coupon deactivated' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
