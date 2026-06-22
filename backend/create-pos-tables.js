require('dotenv').config()
const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment')
  process.exit(1)
}

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    console.log('Creating POS tables...')

    const createTablesQuery = `
      -- 1. Invoices Table
      CREATE TABLE IF NOT EXISTS public.invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        customer_email VARCHAR(255),
        customer_address TEXT,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'CASH',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Invoice Items Table
      CREATE TABLE IF NOT EXISTS public.invoice_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES public.products(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Inventory Transactions Table
      CREATE TABLE IF NOT EXISTS public.inventory_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES public.products(id),
        invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
        quantity_sold INTEGER NOT NULL,
        stock_before INTEGER NOT NULL,
        stock_after INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `

    await client.query(createTablesQuery)
    console.log('POS tables created successfully!')

  } catch (err) {
    console.error('Database Operation Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
