require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const ws = require('ws')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws }
  }
)

const CATEGORIES = [
  'sarees',
  'kadi-fabrics',
  'dress-materials',
  'dupattas',
  'kurtas-sets',
  'bedsheets',
  'towels',
  'accessories'
]

async function test() {
  console.log('Testing products query for each category slug...')
  for (const cat of CATEGORIES) {
    try {
      const { data, error, count } = await supabase
        .from('products')
        .select('*, categories!inner(name,slug)', { count: 'exact' })
        .eq('is_active', true)
        .eq('categories.slug', cat)

      if (error) {
        console.error(`- Category "${cat}": Error - ${error.message}`)
      } else {
        console.log(`- Category "${cat}": Success! Found ${count} products. Names: ${data.map(p => p.name).join(', ')}`)
      }
    } catch (err) {
      console.error(`- Category "${cat}": Exception - ${err.message}`)
    }
  }
}

test()
