async function run() {
  const url = 'https://uakgkzuvzfjbntsnbmmt.supabase.co/rest/v1/products?select=*%2Ccategories%21inner%28name%2Cslug%29&is_active=eq.true'
  const apikey = 'sb_publishable_Aj070L8c9rqPNXYDfIFWSg_96xa54xh'
  
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`
      }
    })
    console.log('HTTP Status:', res.status)
    const text = await res.text()
    console.log('Response (truncated):', text.substring(0, 500))
  } catch (err) {
    console.error('Error:', err.message)
  }
}

run()
