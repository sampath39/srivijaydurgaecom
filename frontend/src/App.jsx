import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import store from './store'
import { supabase } from './lib/supabase'
import { setUser, setProfile, clearAuth, setLoading, setSession } from './store/slices/authSlice'
import { loadCart } from './store/slices/cartSlice'
import { setWishlist } from './store/slices/wishlistSlice'

// Layouts
import CustomerLayout from './components/layout/CustomerLayout'
import AdminLayout    from './components/layout/AdminLayout'
import AuthLayout     from './components/layout/AuthLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute     from './routes/AdminRoute'

// Auth pages
import LoginPage         from './pages/auth/LoginPage'
import SignupPage        from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'

// Helper for lazy loading retry on chunk load failure
function lazyRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport()
    } catch (error) {
      console.error('Lazy import failed, reloading page...', error)
      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('dynamically imported module') ||
        error.message?.includes('Importing a module') ||
        error.name === 'TypeError'
      ) {
        window.location.reload()
        return new Promise(() => {}) // pending
      }
      throw error
    }
  })
}

// Customer pages (lazy-loaded with auto-retry on deploy updates)
const HomePage          = lazyRetry(() => import('./pages/customer/HomePage'))
const ProductsPage      = lazyRetry(() => import('./pages/customer/ProductsPage'))
const ProductDetailPage = lazyRetry(() => import('./pages/customer/ProductDetailPage'))
const CartPage          = lazyRetry(() => import('./pages/customer/CartPage'))
const CheckoutPage      = lazyRetry(() => import('./pages/customer/CheckoutPage'))
const PaymentSuccessPage= lazyRetry(() => import('./pages/customer/PaymentSuccessPage'))
const PaymentFailurePage= lazyRetry(() => import('./pages/customer/PaymentFailurePage'))
const OrdersPage        = lazyRetry(() => import('./pages/customer/OrdersPage'))
const OrderDetailPage   = lazyRetry(() => import('./pages/customer/OrderDetailPage'))
const WishlistPage      = lazyRetry(() => import('./pages/customer/WishlistPage'))
const ProfilePage       = lazyRetry(() => import('./pages/customer/ProfilePage'))
const RewardsPage       = lazyRetry(() => import('./pages/customer/RewardsPage'))
const ReferralPage      = lazyRetry(() => import('./pages/customer/ReferralPage'))
const SearchPage        = lazyRetry(() => import('./pages/customer/SearchPage'))

// Admin pages (lazy-loaded with auto-retry)
const AdminDashboard    = lazyRetry(() => import('./pages/admin/DashboardPage'))
const AdminProducts     = lazyRetry(() => import('./pages/admin/ProductsPage'))
const AddProductPage    = lazyRetry(() => import('./pages/admin/AddProductPage'))
const AdminOrders       = lazyRetry(() => import('./pages/admin/OrdersPage'))
const AdminUsers        = lazyRetry(() => import('./pages/admin/UsersPage'))
const AdminAnalytics    = lazyRetry(() => import('./pages/admin/AnalyticsPage'))
const AdminInventory    = lazyRetry(() => import('./pages/admin/InventoryPage'))
const AdminCoupons      = lazyRetry(() => import('./pages/admin/CouponsPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-gradient-gold rounded-2xl flex items-center justify-center shadow-gold animate-pulse text-2xl">
          🥻
        </div>
        <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

function AppInner() {
  useEffect(() => {
    document.documentElement.classList.add('dark');

    // Restore cart from localStorage
    const saved = localStorage.getItem('svdke_cart')
    if (saved) {
      try { store.dispatch(loadCart(JSON.parse(saved))) } catch {}
    }
    // Restore wishlist
    const wl = localStorage.getItem('svdke_wishlist')
    if (wl) {
      try { store.dispatch(setWishlist(JSON.parse(wl))) } catch {}
    }

    // ── Auth initialisation ────────────────────────────────────────
    // We use getSession() for the initial load (handles page refresh).
    // onAuthStateChange is kept SYNCHRONOUS to avoid a Supabase deadlock:
    // making an async DB call inside the callback tries to acquire the
    // same internal auth-lock that Supabase already holds → infinite hang.
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          store.dispatch(setSession(session))
          const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single()
          if (profile) store.dispatch(setProfile(profile))
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        store.dispatch(setLoading(false))
      }
    }
    initAuth()

    // SYNCHRONOUS listener — no async DB calls here to avoid the lock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        store.dispatch(clearAuth())
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        store.dispatch(setSession(session))
      }
    })
    return () => subscription.unsubscribe()
  }, [])


  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Auth routes ───────────────────────────── */}
          <Route element={<AuthLayout />}>
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/signup"          element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
          </Route>

          {/* ── Customer routes ──────────────────────── */}
          <Route element={<CustomerLayout />}>
            <Route path="/"                element={<HomePage />} />
            <Route path="/products"        element={<ProductsPage />} />
            <Route path="/products/:slug"  element={<ProductDetailPage />} />
            <Route path="/search"          element={<SearchPage />} />
            <Route path="/cart"            element={<CartPage />} />
            <Route path="/wishlist"        element={<WishlistPage />} />

            {/* Protected customer routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout"      element={<CheckoutPage />} />
              <Route path="/orders"        element={<OrdersPage />} />
              <Route path="/orders/:id"    element={<OrderDetailPage />} />
              <Route path="/profile"       element={<ProfilePage />} />
              <Route path="/rewards"       element={<RewardsPage />} />
              <Route path="/referral"      element={<ReferralPage />} />
            </Route>
          </Route>

          {/* Payment result pages (no layout chrome) */}
          <Route path="/orders/success" element={<PaymentSuccessPage />} />
          <Route path="/orders/failure" element={<PaymentFailurePage />} />

          {/* ── Admin routes ─────────────────────────── */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"                  element={<AdminDashboard />} />
              <Route path="/admin/products"         element={<AdminProducts />} />
              <Route path="/admin/products/new"     element={<AddProductPage />} />
              <Route path="/admin/products/edit/:id" element={<AddProductPage />} />
              <Route path="/admin/orders"           element={<AdminOrders />} />
              <Route path="/admin/users"            element={<AdminUsers />} />
              <Route path="/admin/analytics"        element={<AdminAnalytics />} />
              <Route path="/admin/inventory"        element={<AdminInventory />} />
              <Route path="/admin/coupons"          element={<AdminCoupons />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
              <div className="text-8xl mb-6">🥻</div>
              <h1 className="font-display text-5xl font-bold text-gray-900 dark:text-white mb-3">404</h1>
              <p className="text-xl text-gray-500 mb-8">Oops! This page doesn't exist.</p>
              <a href="/" className="btn-primary px-8 py-3 text-lg">Go Home</a>
            </div>
          } />
        </Routes>
      </Suspense>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e1e2e',
            color: '#fff',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  )
}
