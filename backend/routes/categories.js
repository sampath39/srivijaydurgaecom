const express  = require('express')
const router   = express.Router()
const supabase = require('../lib/supabase')
const { Client } = require('pg')

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.get('/with-subcategories', async (_req, res) => {
  let client;
  try {
    client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()
    
    // Group subcategories by category
    const query = `
      SELECT
        c.id, c.name, c.slug, c.icon,
        COALESCE(
          array_agg(DISTINCT p.subcategory) FILTER (WHERE p.subcategory IS NOT NULL),
          '{}'
        ) as subcategories
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name ASC;
    `
    const { rows } = await client.query(query)
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  } finally {
    if (client) await client.end()
  }
})

module.exports = router
