import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminSidebar from '../ui/AdminSidebar'

export default function AdminLayout() {
  const darkMode = useSelector(s => s.ui.darkMode)
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
