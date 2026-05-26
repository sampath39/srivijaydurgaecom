import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft } from 'lucide-react'
import Navbar    from '../ui/Navbar'
import MobileNav from '../ui/MobileNav'
import Footer    from '../ui/Footer'
import CartDrawer from '../ui/CartDrawer'

export default function CustomerLayout() {
  const darkMode = useSelector(s => s.ui.darkMode)
  const location = useLocation()
  const navigate = useNavigate()

  const showBackButton = location.pathname !== '/'

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
        <Navbar />
        <main className="pb-20 md:pb-0 relative">
          {showBackButton && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <button 
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-white border border-dark-900 dark:bg-white dark:hover:bg-gray-100 dark:text-dark-900 dark:border-white shadow-sm transition-all duration-200 font-medium text-sm cursor-pointer hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
            </div>
          )}
          <Outlet />
        </main>
        <Footer />
        <MobileNav />
        <CartDrawer />
      </div>
    </div>
  )
}
