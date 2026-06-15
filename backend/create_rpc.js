require('dotenv').config({path: 'backend/.env'});
const { Client } = require('pg');

const sql = `
CREATE OR REPLACE FUNCTION get_categories_with_subcategories()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  icon TEXT,
  subcategories TEXT[]
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
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
END;
$$;
`;

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  await client.query(sql);
  console.log("RPC created.");
  await client.end();
}).catch(console.error);
