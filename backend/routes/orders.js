const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// GET /api/orders — user's orders
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, images))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, images, slug)), addresses(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/orders/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('status, payment_status')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' })
    }

    await supabase.from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)

    res.json({ success: true, message: 'Order cancelled successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
