require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addStatusColumn() {
  try {
    await pool.query("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed'");
    console.log("Successfully added status column to invoices table.");
    
    // Refresh PostgREST schema cache by notifying pgrst
    await pool.query("NOTIFY pgrst, 'reload schema'");
    console.log("Successfully notified PostgREST to reload schema.");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    pool.end();
  }
}

addStatusColumn();
