import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
  devGoogleLogin: (email) => api.post('/auth/google/dev', { email }),
}

export const projectService = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  share: (id) => api.post(`/projects/${id}/share`),
  getShared: (link) => api.get(`/projects/shared/${link}`),
}

export const uploadService = {
  uploadBlueprint: (projectId, file, layer, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    if (layer) formData.append('layer', layer)
    return api.post(`/upload/blueprint/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  uploadMultiple: (projectId, files, onProgress) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    return api.post(`/upload/blueprints/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  deleteBlueprint: (id) => api.delete(`/upload/blueprint/${id}`),
  uploadThumbnail: (projectId, file) => {
    const formData = new FormData()
    formData.append('thumbnail', file)
    return api.post(`/upload/thumbnail/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const annotationService = {
  getByProject: (projectId) => api.get(`/annotations/project/${projectId}`),
  create: (projectId, data) => api.post(`/annotations/project/${projectId}`, data),
  update: (id, data) => api.put(`/annotations/${id}`, data),
  delete: (id) => api.delete(`/annotations/${id}`),
}

export const materialService = {
  getByProject: (projectId) => api.get(`/materials/project/${projectId}`),
  update: (projectId, data) => api.put(`/materials/project/${projectId}`, data),
  reset: (projectId) => api.post(`/materials/project/${projectId}/reset`),
}

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getProjects: (params) => api.get('/admin/projects', { params }),
  deleteProject: (id) => api.delete(`/admin/projects/${id}`),
  getLogs: (params) => api.get('/admin/logs', { params }),
}
