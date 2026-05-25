async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/products?category=kadi-fabrics')
    const json = await res.json()
    console.log('API Status:', res.status)
    console.log('Success:', json.success)
    console.log('Count:', json.count)
    console.log('Product categories:', json.data?.map(p => p.categories))
  } catch (err) {
    console.error('Error:', err.message)
  }
}

run()
