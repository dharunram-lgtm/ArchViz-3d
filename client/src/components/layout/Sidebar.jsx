import { NavLink } from 'react-router-dom'
import { FiGrid, FiPlus, FiHelpCircle } from 'react-icons/fi'
import { BiBuilding } from 'react-icons/bi'

const links = [
  { to: '/dashboard', label: 'Projects', icon: FiGrid },
  { to: '/dashboard?new=true', label: 'New Project', icon: FiPlus },
]

const bottomLinks = [
  { to: '#', label: 'Help', icon: FiHelpCircle },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white dark:bg-dark-700 border-r border-surface-200 dark:border-dark-400
        transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-200 dark:border-dark-400">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <BiBuilding size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-surface-900 dark:text-dark-50 text-sm">ArchViz 3D</p>
            <p className="text-xs text-surface-500 dark:text-dark-200">Blueprint Viewer</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-surface-600 dark:text-dark-100 hover:bg-surface-100 dark:hover:bg-dark-500'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-surface-200 dark:border-dark-400">
          {bottomLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 dark:text-dark-100 hover:bg-surface-100 dark:hover:bg-dark-500 transition-colors"
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  )
}
