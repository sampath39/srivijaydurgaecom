require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('invoices', 'invoice_items', 'inventory_transactions')").then(r=>{console.log(r.rows); pool.end()}).catch(e=>console.error(e));
