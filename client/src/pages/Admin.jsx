import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiUsers, FiFolder, FiFile, FiActivity, FiTrash2, FiSearch, FiRefreshCw } from 'react-icons/fi'
import { adminService } from '../services/auth'
import { formatDate, truncate } from '../utils/helpers'
import Loader from '../components/common/Loader'
import ConfirmModal from '../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [logs, setLogs] = useState([])
  const tab = searchParams.get('tab') || 'overview'
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteType, setDeleteType] = useState(null)

  useEffect(() => {
    fetchDashboard()
    fetchUsers()
    fetchProjects()
    fetchLogs()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await adminService.getDashboard()
      setData(res.data)
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const fetchUsers = async (s = '') => {
    try {
      const res = await adminService.getUsers({ search: s || undefined })
      setUsers(res.data.users)
    } catch {}
  }

  const fetchProjects = async (s = '') => {
    try {
      const res = await adminService.getProjects({ search: s || undefined })
      setProjects(res.data.projects)
    } catch {}
  }

  const fetchLogs = async () => {
    try {
      const res = await adminService.getLogs()
      setLogs(res.data.logs)
    } catch {}
  }

  const handleDeleteUser = async (id) => {
    setDeleteTarget(id)
    setDeleteType('user')
  }

  const handleDeleteProject = async (id) => {
    setDeleteTarget(id)
    setDeleteType('project')
  }

  const confirmDelete = async () => {
    const targetId = deleteTarget
    const targetType = deleteType
    if (!targetId || !targetType) return
    try {
      if (targetType === 'user') {
        await adminService.deleteUser(targetId)
        setUsers((prev) => prev.filter((u) => u._id !== targetId))
        toast.success('User deleted')
      } else {
        await adminService.deleteProject(targetId)
        setProjects((prev) => prev.filter((p) => p._id !== targetId))
        toast.success('Project deleted')
      }
    } catch { toast.error('Failed to delete') }
    setDeleteTarget(null)
    setDeleteType(null)
  }

  const handleSearch = (val) => {
    setSearch(val)
    if (tab === 'users') fetchUsers(val)
    if (tab === 'projects') fetchProjects(val)
  }

  if (loading) return <Loader fullScreen />

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'projects', label: 'Projects', icon: FiFolder },
    { id: 'logs', label: 'Activity Logs', icon: FiFile },
  ]

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-1">Manage users, projects, and monitor activity</p>
        </div>
        <button onClick={() => { fetchDashboard(); fetchUsers(); fetchProjects(); fetchLogs() }} className="btn-secondary flex items-center gap-2">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSearchParams(id === 'overview' ? {} : { tab: id })}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id ? 'bg-white/10 text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && data && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: data.stats?.totalUsers || 0, icon: FiUsers, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
              { label: 'Total Projects', value: data.stats?.totalProjects || 0, icon: FiFolder, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
              { label: 'Total Blueprints', value: data.stats?.totalBlueprints || 0, icon: FiFile, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
              { label: 'Activity Logs', value: data.activityLogs?.length || 0, icon: FiActivity, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-dark-50">{stat.value}</p>
                <p className="text-sm text-surface-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-surface-900 dark:text-dark-50 mb-4">Recent Users</h3>
              <div className="space-y-3">
                {data.recentUsers?.map((u) => (
                  <div key={u._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-700 dark:text-dark-100">{u.name}</p>
                      <p className="text-xs text-surface-400">{u.email}</p>
                    </div>
                    <span className="ml-auto text-xs text-surface-400">{formatDate(u.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-surface-900 dark:text-dark-50 mb-4">Recent Projects</h3>
              <div className="space-y-3">
                {data.recentProjects?.map((p) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <FiFolder size={16} className="text-surface-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-700 dark:text-dark-100 truncate">{p.name}</p>
                      <p className="text-xs text-surface-400 truncate">{p.user?.name}</p>
                    </div>
                    <span className="text-xs text-surface-400">{formatDate(p.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="relative mb-4">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => handleSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 dark:bg-dark-600">
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Provider</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Joined</th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-dark-400">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-surface-50 dark:hover:bg-dark-500">
                      <td className="px-4 py-3 text-surface-900 dark:text-dark-50">{u.name}</td>
                      <td className="px-4 py-3 text-surface-600">{u.email}</td>
                      <td className="px-4 py-3"><span className="badge-primary text-xs">{u.authProvider}</span></td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${u.role === 'admin' ? 'badge-warning' : 'badge-success'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-surface-500">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteUser(u._id)} disabled={u.role === 'admin'} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 disabled:opacity-30">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div>
          <div className="relative mb-4">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search projects..." value={search} onChange={(e) => handleSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 dark:bg-dark-600">
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Blueprints</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-dark-400">
                  {projects.map((p) => (
                    <tr key={p._id} className="hover:bg-surface-50 dark:hover:bg-dark-500">
                      <td className="px-4 py-3 text-surface-900 dark:text-dark-50 font-medium">{truncate(p.name, 30)}</td>
                      <td className="px-4 py-3 text-surface-600">{p.user?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-surface-600">{p.blueprints?.length || 0}</td>
                      <td className="px-4 py-3 text-surface-500">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteProject(p._id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-dark-600">
                  <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">User</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-dark-200">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-dark-400">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-50 dark:hover:bg-dark-500">
                    <td className="px-4 py-3 text-surface-900 dark:text-dark-50">{log.user?.name || 'System'}</td>
                    <td className="px-4 py-3"><span className="badge-primary text-xs">{log.action}</span></td>
                    <td className="px-4 py-3 text-surface-500 max-w-[200px] truncate">
                      {log.details?.action || Object.values(log.details || {}).filter(v => typeof v === 'string').join(', ') || JSON.stringify(log.details || {})}
                    </td>
                    <td className="px-4 py-3 text-surface-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteType(null) }}
        onConfirm={confirmDelete}
        title={deleteType === 'user' ? 'Delete User' : 'Delete Project'}
        message={deleteType === 'user' ? 'Delete this user and all their data? This cannot be undone.' : 'Delete this project? This cannot be undone.'}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
