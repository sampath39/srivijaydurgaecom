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

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 transition-colors duration-300">
        <Navbar />
        <main className="pb-20 md:pb-0 relative">
          <Outlet />
        </main>
        <Footer />
        <MobileNav />
        <CartDrawer />
      </div>
    </div>
  )
}
