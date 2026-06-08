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

    const address = addresses[0]
    console.log('Address found:', address.id)

    // Get a product
    console.log('3. Fetching product details...')
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    const product = products[0]
    console.log('Product found:', product.id)

    const payload = {
      cart_items: [
        { product_id: product.id, quantity: 1, size: 'M' }
      ],
      address_id: address.id,
      coupon_code: '',
      points_to_use: 0
    }

    console.log('4. Sending request to /api/payments/create-order...')
    const res = await fetch('http://localhost:5000/api/payments/create-order', {
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
