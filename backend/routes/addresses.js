const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/auth')
const supabase = require('../lib/supabase')

// GET /api/addresses
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('addresses').select('*')
      .eq('user_id', req.user.id).order('is_default', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST /api/addresses
router.post('/', auth, async (req, res) => {
  try {
    if (req.body.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', req.user.id)
    }
    const { data, error } = await supabase
      .from('addresses').insert({ ...req.body, user_id: req.user.id }).select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// PUT /api/addresses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.body.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', req.user.id)
    }
    const { data, error } = await supabase
      .from('addresses').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// DELETE /api/addresses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await supabase.from('addresses').delete().eq('id', req.params.id).eq('user_id', req.user.id)
    res.json({ success: true, message: 'Address deleted' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
