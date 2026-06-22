const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const auth = require('../middleware/auth')
const adminOnly = require('../middleware/adminOnly')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// GET /api/pos/products - Search products
router.get('/products', auth, adminOnly, async (req, res) => {
  try {
    const { search } = req.query
    let queryStr = `
      SELECT id, name, slug, price, discount_price, stock_count, sku, images, is_active
      FROM products
      WHERE is_active = true
    `
    const values = []
    
    if (search && search.trim() !== '') {
      values.push(`%${search}%`)
      queryStr += ` AND (name ILIKE $1 OR sku ILIKE $1 OR CAST(id AS TEXT) ILIKE $1)`
    }
    
    queryStr += ` ORDER BY name ASC LIMIT 50`

    const { rows } = await pool.query(queryStr, values)

    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/pos/checkout - Create invoice and deduct stock
router.post('/checkout', auth, adminOnly, async (req, res) => {
  const client = await pool.connect()
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items, // array of { productId, productName, quantity, unitPrice, subtotal }
      subtotal,
      discount,
      tax,
      total,
      paymentMethod
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' })
    }

    await client.query('BEGIN')

    // 1. Check stock for all items and deduct
    for (const item of items) {
      const stockCheck = await client.query('SELECT stock_count FROM products WHERE id = $1 FOR UPDATE', [item.productId])
      if (stockCheck.rows.length === 0) {
        throw new Error(`Product not found: ${item.productName}`)
      }
      
      const currentStock = stockCheck.rows[0].stock_count
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productName}. Available: ${currentStock}`)
      }

      await client.query('UPDATE products SET stock_count = stock_count - $1 WHERE id = $2', [item.quantity, item.productId])
    }

    // 2. Generate Invoice Number (e.g. POS-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 8)
    const seqRes = await client.query("SELECT nextval('invoices_seq')") // Wait, we don't have a sequence.
    // Let's use a random suffix or a simpler approach:
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const invoiceNumber = `Invoice-${dateStr}-${randomSuffix}`

    // 3. Create Invoice
    const invoiceRes = await client.query(`
      INSERT INTO invoices (
        invoice_number, customer_name, customer_phone, customer_email, customer_address,
        subtotal, discount, tax, total, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      invoiceNumber, customerName, customerPhone, customerEmail, customerAddress,
      subtotal, discount, tax, total, paymentMethod
    ])
    
    const invoice = invoiceRes.rows[0]

    // 4. Create Invoice Items and Inventory Transactions
    for (const item of items) {
      // Insert item
      await client.query(`
        INSERT INTO invoice_items (
          invoice_id, product_id, product_name, quantity, unit_price, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [invoice.id, item.productId, item.productName, item.quantity, item.unitPrice, item.subtotal])

      // Calculate stock before and after for the transaction log
      const stockCheck2 = await client.query('SELECT stock_count FROM products WHERE id = $1', [item.productId])
      const stockAfter = stockCheck2.rows[0].stock_count
      const stockBefore = stockAfter + item.quantity

      // Log transaction
      await client.query(`
        INSERT INTO inventory_transactions (
          product_id, invoice_id, quantity_sold, stock_before, stock_after
        ) VALUES ($1, $2, $3, $4, $5)
      `, [item.productId, invoice.id, item.quantity, stockBefore, stockAfter])
    }

    await client.query('COMMIT')
    res.json({ success: true, data: invoice })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ success: false, message: err.message })
  } finally {
    client.release()
  }
})

// GET /api/pos/invoices - List history
router.get('/invoices', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, startDate, endDate } = req.query
    const offset = (page - 1) * limit
    
    let queryStr = 'FROM invoices WHERE 1=1'
    const values = []
    
    if (search) {
      values.push(`%${search}%`)
      queryStr += ` AND (invoice_number ILIKE $${values.length} OR customer_name ILIKE $${values.length} OR customer_phone ILIKE $${values.length})`
    }
    
    if (startDate) {
      values.push(startDate)
      queryStr += ` AND created_at >= $${values.length}`
    }

    if (endDate) {
      values.push(endDate)
      // Adding 1 day to include the end date fully
      queryStr += ` AND created_at < $${values.length}::timestamp + interval '1 day'`
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${queryStr}`, values)
    const totalCount = parseInt(countRes.rows[0].count)

    const dataRes = await pool.query(`
      SELECT * ${queryStr}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `, [...values, limit, offset])

    res.json({
      success: true,
      data: dataRes.rows,
      count: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(totalCount / limit)
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/pos/invoices/:id - Get specific invoice
router.get('/invoices/:id', auth, adminOnly, async (req, res) => {
  try {
    const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id])
    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    const invoice = invoiceRes.rows[0]

    const itemsRes = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id])
    invoice.items = itemsRes.rows

    res.json({ success: true, data: invoice })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
