const express  = require('express')
const router   = express.Router()
const supabase = require('../lib/supabase')

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
