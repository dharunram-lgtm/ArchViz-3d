import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiGrid, FiList, FiFolder, FiClock, FiTag, FiTrash2, FiEdit2, FiShare2 } from 'react-icons/fi'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { projectService } from '../services/auth'
import { formatDate, truncate } from '../utils/helpers'
import Modal from '../components/common/Modal'
import Loader from '../components/common/Loader'
import ConfirmModal from '../components/common/ConfirmModal'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sort, setSort] = useState('newest')
  const [createModal, setCreateModal] = useState(searchParams.get('new') === 'true')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newProject, setNewProject] = useState({ name: '', description: '', tags: '' })
  const [creating, setCreating] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = { sort }
      if (search) params.search = search
      const res = await projectService.getAll(params)
      setProjects(res.data.projects)
    } catch (err) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [search, sort])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newProject.name.trim()) {
      toast.error('Project name is required')
      return
    }
    setCreating(true)
    try {
      const res = await projectService.create({
        name: newProject.name,
        description: newProject.description,
        tags: newProject.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setProjects((prev) => [res.data.project, ...prev])
      setCreateModal(false)
      setNewProject({ name: '', description: '', tags: '' })
      toast.success('Project created')
      navigate(`/project/${res.data.project._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation()
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    const targetId = deleteTarget
    if (!targetId) return
    try {
      await projectService.delete(targetId)
      setProjects((prev) => prev.filter((p) => p._id !== targetId))
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-dark-50">My Projects</h1>
          <p className="text-surface-600 dark:text-dark-200 mt-1">Manage and view your 3D blueprints</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
          <FiPlus size={18} /> New Project
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text" placeholder="Search projects..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-auto">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A-Z</option>
          <option value="updated">Recently Updated</option>
        </select>
        <div className="flex bg-surface-100 dark:bg-dark-600 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-dark-500 shadow-sm' : ''}`}>
            <FiGrid size={16} className="text-surface-600 dark:text-dark-100" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-dark-500 shadow-sm' : ''}`}>
            <FiList size={16} className="text-surface-600 dark:text-dark-100" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size="lg" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FiFolder size={64} className="mx-auto text-surface-300 dark:text-dark-400 mb-4" />
          <h3 className="text-xl font-semibold text-surface-700 dark:text-dark-100 mb-2">No projects yet</h3>
          <p className="text-surface-500 dark:text-dark-200 mb-6">Create your first project to get started</p>
          <button onClick={() => setCreateModal(true)} className="btn-primary">Create Project</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/project/${project._id}`)}
              className="card p-5 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FiFolder size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/project/${project._id}`) }} className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-dark-500 text-surface-500">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={(e) => handleDelete(project._id, e)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-dark-50 mb-1">{truncate(project.name, 30)}</h3>
              {project.description && (
                <p className="text-sm text-surface-500 dark:text-dark-200 mb-3 line-clamp-2">{truncate(project.description, 80)}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-dark-300">
                <span className="flex items-center gap-1"><FiClock size={12} /> {formatDate(project.createdAt)}</span>
                {project.blueprints?.length > 0 && (
                  <span className="flex items-center gap-1">{project.blueprints.length} files</span>
                )}
              </div>
              {project.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="badge-primary text-xs">{tag}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-surface-200 dark:divide-dark-400">
          {projects.map((project) => (
            <div key={project._id} onClick={() => navigate(`/project/${project._id}`)} className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-dark-500 cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <FiFolder size={18} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-900 dark:text-dark-50 truncate">{project.name}</p>
                <p className="text-sm text-surface-500 truncate">{project.description || 'No description'}</p>
              </div>
              <span className="text-xs text-surface-400 whitespace-nowrap">{formatDate(project.createdAt)}</span>
              <button onClick={(e) => handleDelete(project._id, e)} className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Delete this project? This cannot be undone."
        confirmLabel="Delete"
        danger
      />

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-dark-100 mb-1.5">Project Name *</label>
            <input type="text" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder="My Building Design" className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-dark-100 mb-1.5">Description</label>
            <textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} placeholder="Brief description of your project..." className="input-field min-h-[80px] resize-none" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-dark-100 mb-1.5">Tags</label>
            <input type="text" value={newProject.tags} onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })} placeholder="residential, modern, 3-bedroom" className="input-field" />
            <p className="text-xs text-surface-400 mt-1">Separate tags with commas</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
