import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">TRADEAI</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-800"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-8">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>📊</span>
            {sidebarOpen && <span className="ml-3">Dashboard</span>}
          </Link>
          <Link
            to="/budgets"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>💰</span>
            {sidebarOpen && <span className="ml-3">Budgets</span>}
          </Link>
          <Link
            to="/promotions"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>🎯</span>
            {sidebarOpen && <span className="ml-3">Promotions</span>}
          </Link>
          <Link
            to="/customers"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>👥</span>
            {sidebarOpen && <span className="ml-3">Customers</span>}
          </Link>
          <Link
            to="/products"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>📦</span>
            {sidebarOpen && <span className="ml-3">Products</span>}
          </Link>
          <Link
            to="/analytics"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>📈</span>
            {sidebarOpen && <span className="ml-3">Analytics</span>}
          </Link>
          <Link
            to="/reports"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>📄</span>
            {sidebarOpen && <span className="ml-3">Reports</span>}
          </Link>
          <div className="border-t border-gray-700 my-4"></div>
          <Link
            to="/ml"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>🤖</span>
            {sidebarOpen && <span className="ml-3">ML/AI</span>}
          </Link>
          <Link
            to="/ai-chatbot"
            className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            <span className={sidebarOpen ? 'ml-0' : ''}>💬</span>
            {sidebarOpen && <span className="ml-3">AI Assistant</span>}
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
