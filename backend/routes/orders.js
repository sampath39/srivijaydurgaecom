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

// ── GET /api/orders/admin/all ─────────────────────────────────
// Admin: list all orders with customer info, pagination, filters
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.min(50, parseInt(req.query.limit) || 20)
    const status = req.query.status || ''
    const search = req.query.search || ''
    const offset = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_method, total_amount, subtotal, discount_amount, shipping_charge, created_at, updated_at, profiles(full_name, email, phone), order_items(id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('order_number', `%${search}%`)

    const { data, count, error } = await query
    if (error) throw error

    res.json({ success: true, data: data || [], count: count || 0 })
  } catch (err) {
    console.error('admin/all error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PUT /api/orders/:id/status ────────────────────────────────
// Admin: update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const VALID = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    const { status } = req.body

    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` })
    }

    const updateFields = { status, updated_at: new Date().toISOString() }
    if (status === 'delivered') {
      updateFields.payment_status = 'paid'
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', req.params.id)
      .select('id, order_number, status, user_id, total_amount, payment_status')
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ success: false, message: 'Order not found' })

    // Notify the customer about status change
    const statusMessages = {
      confirmed:  'Your order has been confirmed! 🎉',
      processing: 'Your order is being packed 📦',
      shipped:    'Your order is on the way! 🚚',
      delivered:  'Your order has been delivered! ✅',
      cancelled:  'Your order has been cancelled.',
      refunded:   'Your refund has been processed.',
    }
    if (statusMessages[status]) {
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        title:   `Order ${data.order_number} — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: statusMessages[status],
        type:    'order',
        link:    `/orders/${data.id}`,
      }).catch(() => null)
    }

    res.json({ success: true, data, message: `Order updated to "${status}"` })
  } catch (err) {
    console.error('status update error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
