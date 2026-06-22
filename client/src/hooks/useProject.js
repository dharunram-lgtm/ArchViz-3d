import { useState, useCallback } from 'react'
import { projectService } from '../services/auth'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, currentPage: 1 })

  const fetchProjects = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const res = await projectService.getAll(params)
      setProjects(res.data.projects)
      setPagination({
        total: res.data.total,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
      })
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = async (data) => {
    const res = await projectService.create(data)
    setProjects((prev) => [res.data.project, ...prev])
    return res.data.project
  }

  const updateProject = async (id, data) => {
    const res = await projectService.update(id, data)
    setProjects((prev) => prev.map((p) => (p._id === id ? res.data.project : p)))
    return res.data.project
  }

  const deleteProject = async (id) => {
    await projectService.delete(id)
    setProjects((prev) => prev.filter((p) => p._id !== id))
  }

  return { projects, loading, pagination, fetchProjects, createProject, updateProject, deleteProject }
}
