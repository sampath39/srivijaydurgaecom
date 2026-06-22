require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'decrement_stock'").then(r=>{console.log(r.rows[0].pg_get_functiondef); pool.end()}).catch(e=>{console.error(e); pool.end()});
