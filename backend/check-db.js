require('dotenv').config()
const supabase = require('./lib/supabase')

async function run() {
  try {
    const { data: categories, error: catError } = await supabase.from('categories').select('*')
    if (catError) throw catError
    console.log('--- CATEGORIES ---')
    console.log(categories)

    const { data: products, error: prodError } = await supabase.from('products').select('id, name, price, category_id')
    if (prodError) throw prodError
    console.log('--- PRODUCTS ---')
    console.log(products)
  } catch (err) {
    console.error('Error:', err.message)
  }
}

run()
