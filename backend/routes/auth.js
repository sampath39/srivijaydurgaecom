const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// POST /api/auth/profile-sync
router.post('/profile-sync', auth, async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body
    const { data, error } = await supabase.from('profiles')
      .upsert({ id: req.user.id, email: req.user.email, full_name, phone, avatar_url })
      .select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/auth/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body
    const { data, error } = await supabase.from('profiles')
      .update({ full_name, phone, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.user.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET /api/auth/notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(30)
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/auth/notifications/read-all
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
