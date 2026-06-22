require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@svdke.com'")
  .then(() => { console.log('Updated to super_admin'); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });
