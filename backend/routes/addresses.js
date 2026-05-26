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
  } catch (err) {
    console.error('[GET /addresses] Error:', err.message, err.code, err.details)
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/addresses
router.post('/', auth, async (req, res) => {
  try {
    console.log('[POST /addresses] user_id:', req.user?.id)
    console.log('[POST /addresses] body:', JSON.stringify(req.body))

    if (req.body.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', req.user.id)
    }

    // Strip any fields that shouldn't come from the client
    const { full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default } = req.body

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: req.user.id,
        full_name,
        phone,
        address_line1,
        address_line2: address_line2 || null,
        city,
        state,
        pincode,
        country: country || 'India',
        is_default: is_default || false
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /addresses] DB Error:', error.message, error.code, error.details, error.hint)
      throw error
    }

    console.log('[POST /addresses] Success, id:', data.id)
    res.status(201).json({ success: true, data })
  } catch (err) {
    console.error('[POST /addresses] Caught:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
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
  } catch (err) {
    console.error('[PUT /addresses] Error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/addresses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await supabase.from('addresses').delete().eq('id', req.params.id).eq('user_id', req.user.id)
    res.json({ success: true, message: 'Address deleted' })
  } catch (err) {
    console.error('[DELETE /addresses] Error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
