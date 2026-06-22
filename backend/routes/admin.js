const express   = require('express')
const router    = express.Router()
const auth      = require('../middleware/auth')
const adminOnly = require('../middleware/adminOnly')
const supabase  = require('../lib/supabase')

// GET /api/admin/dashboard
router.get('/dashboard', auth, adminOnly, async (_req, res) => {
  try {
    const [
      { count: totalOrders },
      { count: totalProducts },
      { count: totalUsers },
      { data: recentOrders },
      { data: topProducts },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('*, profiles(full_name,email), order_items(count)')
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('products').select('id, name, images, sold_count, price, discount_price')
        .eq('is_active', true).order('sold_count', { ascending: false }).limit(5),
    ])

    const { data: revenueData } = await supabase.from('orders')
      .select('total_amount, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const totalRevenue = revenueData?.reduce((s, o) => s + Number(o.total_amount), 0) || 0

    res.json({
      success: true,
      stats: { totalOrders, totalProducts, totalUsers, totalRevenue },
      recentOrders,
      topProducts,
      revenueData,
    })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// DELETE /api/admin/revenue/reset
router.delete('/revenue/reset', auth, adminOnly, async (req, res) => {
  try {
    const { Pool } = require('pg')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    
    // Truncate both orders and invoices (and cascade to their items/logs)
    await pool.query('TRUNCATE TABLE public.orders CASCADE;')
    await pool.query('TRUNCATE TABLE public.invoices CASCADE;')
    
    await pool.end()
    
    res.json({ success: true, message: 'Revenue and orders have been completely reset.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/admin/orders
router.get('/orders', auth, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    let query = supabase.from('orders')
      .select('*, profiles(full_name, email, phone), order_items(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)
    const { data, count, error } = await query
    if (error) throw error
    res.json({ success: true, data, count })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body
    const { data, error } = await supabase.from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single()
    if (error) throw error

    await supabase.from('notifications').insert({
      user_id: data.user_id,
      title:   `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your order #${data.order_number} is now ${status}.`,
      type:    'order',
      link:    `/orders/${data.id}`,
    })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/admin/users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    let query = supabase.from('profiles')
      .select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)
    const { data, count, error } = await query
    if (error) throw error
    res.json({ success: true, data, count })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/admin/users/:id/special-discount
router.put('/users/:id/special-discount', auth, adminOnly, async (req, res) => {
  try {
    const { special_discount } = req.body
    const { data, error } = await supabase.from('profiles')
      .update({ special_discount: Number(special_discount) })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/admin/inventory
router.get('/inventory', auth, adminOnly, async (_req, res) => {
  try {
    const { data } = await supabase.from('products')
      .select('id, name, sku, stock_count, price, images, categories(name)')
      .eq('is_active', true).order('stock_count', { ascending: true })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/admin/inventory/:id
router.put('/inventory/:id', auth, adminOnly, async (req, res) => {
  try {
    const { stock_count } = req.body
    const { data, error } = await supabase.from('products')
      .update({ stock_count }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/admin/whatsapp/send
router.post('/whatsapp/send', auth, adminOnly, async (req, res) => {
  try {
    const { recipientType, userIds, mode, body, templateSid, templateVariables } = req.body

    // 1. Fetch recipient profiles
    let recipients = []
    if (recipientType === 'selected') {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No users selected' })
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds)
      if (error) throw error
      recipients = data || []
    } else if (recipientType === 'all') {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('role', 'customer')
      if (error) throw error
      recipients = data || []
    } else {
      return res.status(400).json({ success: false, message: 'Invalid recipient type' })
    }

    // Filter out profiles without phone number
    const targetRecipients = recipients.filter(r => r.phone && r.phone.trim())
    if (targetRecipients.length === 0) {
      return res.status(200).json({
        success: true,
        summary: { total: recipients.length, sent: 0, failed: recipients.length },
        results: recipients.map(r => ({
          userId: r.id,
          name: r.full_name || 'No Name',
          phone: r.phone || '',
          status: 'failed',
          error: 'No phone number configured'
        }))
      })
    }

    // 2. Initialize Twilio client
    const twilio = require('twilio')
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

    // 3. Send messages
    const results = []
    let sentCount = 0
    let failedCount = 0

    await Promise.all(targetRecipients.map(async (recipient) => {
      let phone = recipient.phone.trim()
      phone = phone.replace(/[\s\-\(\)]/g, '')
      if (!phone.startsWith('+')) {
        if (phone.length === 10) {
          phone = '+91' + phone
        } else {
          phone = '+' + phone
        }
      }
      const to = `whatsapp:${phone}`

      try {
        let msgOptions = { from: fromNumber, to }

        if (mode === 'template') {
          msgOptions.contentSid = templateSid || 'HXb5b62575e6e4ff6129ad7c8efe1f983e'
          msgOptions.contentVariables = typeof templateVariables === 'string'
            ? templateVariables
            : JSON.stringify(templateVariables)
        } else {
          if (!body || !body.trim()) {
            throw new Error('Message body is empty')
          }
          msgOptions.body = body
        }

        const message = await client.messages.create(msgOptions)
        results.push({
          userId: recipient.id,
          name: recipient.full_name || 'No Name',
          phone: recipient.phone,
          status: 'sent',
          sid: message.sid
        })
        sentCount++
      } catch (err) {
        results.push({
          userId: recipient.id,
          name: recipient.full_name || 'No Name',
          phone: recipient.phone,
          status: 'failed',
          error: err.message
        })
        failedCount++
      }
    }))

    // Add also those users who did not have a phone number
    recipients.forEach(r => {
      if (!r.phone || !r.phone.trim()) {
        results.push({
          userId: r.id,
          name: r.full_name || 'No Name',
          phone: '',
          status: 'failed',
          error: 'No phone number configured'
        })
        failedCount++
      }
    })

    res.json({
      success: true,
      summary: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount
      },
      results
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
