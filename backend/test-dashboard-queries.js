require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  try {
    const [
      { count: totalOrders, error: e1 },
      { count: totalProducts, error: e2 },
      { count: totalUsers, error: e3 },
      { data: recentOrders, error: e4 },
      { data: topProducts, error: e5 },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('*, profiles(full_name,email), order_items(count)')
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('products').select('id, name, images, sold_count, price, discount_price')
        .eq('is_active', true).order('sold_count', { ascending: false }).limit(5),
    ]);

    console.log("totalOrders Error:", e1);
    console.log("totalProducts Error:", e2);
    console.log("totalUsers Error:", e3);
    console.log("recentOrders Error:", e4);
    console.log("topProducts Error:", e5);
    
    // Also try /admin/orders equivalent
    const { data: ordersData, error: ordersError } = await supabase.from('orders')
      .select('*, profiles(full_name, email, phone), order_items(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
      
    console.log("Orders Error:", ordersError);
    
    const { data: productsData, error: productsError } = await supabase.from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .limit(1);
      
    console.log("Products Error:", productsError);
    
  } catch (err) {
    console.error("Exception:", err);
  }
}
run();
