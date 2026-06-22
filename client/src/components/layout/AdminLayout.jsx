import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FiShield, FiActivity, FiUsers, FiFolder, FiFile, FiLogOut, FiArrowLeft, FiMenu } from 'react-icons/fi'
import { BiBuilding } from 'react-icons/bi'
import { useAuth } from '../../context/AuthContext'

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: FiActivity },
  { to: '/admin/dashboard?tab=users', label: 'Users', icon: FiUsers },
  { to: '/admin/dashboard?tab=projects', label: 'Projects', icon: FiFolder },
  { to: '/admin/dashboard?tab=logs', label: 'Activity Logs', icon: FiFile },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-slate-800/50 backdrop-blur-xl border-r border-white/5
        transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <FiShield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Admin Panel</p>
            <p className="text-xs text-slate-400">Platform Management</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {adminLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5 space-y-1">
          <NavLink
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BiBuilding size={18} />
            Back to App
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <FiLogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="h-16 bg-slate-800/30 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 lg:hidden">
            <FiMenu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <NavLink to="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <FiArrowLeft size={14} />
              Back to App
            </NavLink>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 hidden sm:block">{user.name}</span>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">
                {user.name?.[0]?.toUpperCase()}
              </div>
            </div>
          )}
        </nav>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
