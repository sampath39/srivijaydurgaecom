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

async function test() {
  try {
    console.log('Testing query: products select with categories!inner and filtering by categories.slug...')
    const { data, error, count } = await supabase
      .from('products')
      .select('*, categories!inner(name,slug)', { count: 'exact' })
      .eq('is_active', true)
      .eq('categories.slug', 'kadi-fabrics')

    if (error) {
      console.error('Query Error:', error.message)
    } else {
      console.log('Success!')
      console.log('Count:', count)
      console.log('Products:', data)
    }
  } catch (err) {
    console.error('Crash Error:', err.message)
  }
}

test()
