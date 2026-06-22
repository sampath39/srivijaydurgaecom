require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const run = async () => {
  try {
    await pool.query("ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
    await pool.query("ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin', 'super_admin', 'support_agent', 'content_manager'))");
    await pool.query("UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@svdke.com'");
    console.log("Updated check constraint and role");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
};
run();
