import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiSun, FiMoon, FiBell, FiLogOut, FiUser, FiSettings, FiGrid } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getInitials } from '../../utils/helpers'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [dropdown, setDropdown] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-40 h-16 bg-white/80 dark:bg-dark-700/80 backdrop-blur-xl border-b border-surface-200 dark:border-dark-400">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-500 text-surface-600 dark:text-dark-100 lg:hidden">
            <FiMenu size={20} />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <FiGrid size={16} className="text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-dark-50 hidden sm:block">ArchViz 3D</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-500 text-surface-600 dark:text-dark-100 transition-colors">
            {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          <button className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-500 text-surface-600 dark:text-dark-100 transition-colors relative">
            <FiBell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {user && (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-500 transition-colors"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold">
                    {getInitials(user.name)}
                  </div>
                )}
                <span className="text-sm font-medium text-surface-700 dark:text-dark-100 hidden md:block">{user.name}</span>
              </button>

              {dropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-600 rounded-xl shadow-xl border border-surface-200 dark:border-dark-400 py-1 animate-scale-in z-50">
                  <div className="px-4 py-3 border-b border-surface-200 dark:border-dark-400">
                    <p className="text-sm font-medium text-surface-900 dark:text-dark-50">{user.name}</p>
                    <p className="text-xs text-surface-500 dark:text-dark-200">{user.email}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-dark-100 hover:bg-surface-100 dark:hover:bg-dark-500 transition-colors">
                    <FiGrid size={16} /> Dashboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin/dashboard" onClick={() => setDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-dark-100 hover:bg-surface-100 dark:hover:bg-dark-500 transition-colors">
                      <FiSettings size={16} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <FiLogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
