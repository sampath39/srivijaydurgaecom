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

const EMAIL = 'admin@svdke.com'
const PASSWORD = 'admin12345'

async function run() {
  try {
    console.log(`1. Logging in as ${EMAIL}...`)
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    })

    if (authErr) {
      console.error('Login error:', authErr.message)
      return
    }

    const token = authData.session.access_token
    console.log('Login successful. Token acquired.')

    // Get an address ID belonging to this user
    console.log('2. Fetching user address...')
    const { data: addresses, error: addrErr } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', authData.user.id)

    if (addrErr) {
      console.error('Fetch address error:', addrErr.message)
      return
    }

    if (!addresses || addresses.length === 0) {
      console.error('No address found for this user.')
      return
    }

    const address = addresses[0]
    console.log('Address found:', address.id, address.full_name)

    // Get a product
    console.log('3. Fetching product details...')
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (prodErr) {
      console.error('Fetch product error:', prodErr.message)
      return
    }

    if (!products || products.length === 0) {
      console.error('No products found in DB.')
      return
    }

    const product = products[0]
    console.log('Product found:', product.id, product.name)

    const payload = {
      cart_items: [
        { product_id: product.id, quantity: 1, size: 'M' }
      ],
      address_id: address.id,
      coupon_code: '',
      points_to_use: 0
    }

    console.log('4. Sending request to /api/payments/cod...')
    const res = await fetch('http://localhost:5000/api/payments/cod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    console.log('HTTP Status:', res.status)
    const json = await res.json()
    console.log('Response:', JSON.stringify(json, null, 2))

  } catch (err) {
    console.error('Crash error:', err.message)
  }
}

run()
