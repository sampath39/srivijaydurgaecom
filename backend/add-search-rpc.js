require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const rpcSQL = `
CREATE OR REPLACE FUNCTION search_products(search_term text)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE is_active = true
  AND (
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(fabric, '') || ' ' || COALESCE(color, '') || ' ' || COALESCE(subcategory, '')) @@ websearch_to_tsquery('english', search_term)
    OR name ILIKE '%' || search_term || '%'
    OR sku ILIKE '%' || search_term || '%'
  )
  ORDER BY 
    ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), websearch_to_tsquery('english', search_term)) DESC
  LIMIT 24;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

pool.query(rpcSQL)
  .then(() => {
    console.log("Successfully created search_products RPC.");
    pool.end();
  })
  .catch(err => {
    console.error("Error creating RPC:", err);
    pool.end();
  });
