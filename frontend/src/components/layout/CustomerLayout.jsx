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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-dark-700 shadow-sm transition-all duration-200 font-medium text-sm cursor-pointer hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-primary-500" /> Go Back
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
