export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export const truncate = (str, len = 50) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

export const getFileIcon = (type) => {
  const icons = {
    png: '🖼', jpg: '🖼', jpeg: '🖼',
    pdf: '📄',
    dxf: '📐',
    glb: '🧊', gltf: '🧊', obj: '🧊',
    scad: '🔧',
  }
  return icons[type] || '📁'
}

export const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const generateColor = (index) => {
  const colors = [
    '#4c6ef5', '#7950f2', '#e64980', '#f76707',
    '#40c057', '#15aabf', '#fab005', '#fd7e14',
  ]
  return colors[index % colors.length]
}
