import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await authService.getProfile()
      setUser(res.data.user)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const res = await authService.login({ email, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    setUser(res.data.user)
    return res.data.user
  }

  const handleOAuthCallback = (token, refreshToken, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    if (userData) setUser(typeof userData === 'string' ? JSON.parse(decodeURIComponent(userData)) : userData)
    else loadUser()
  }

  const logout = async () => {
    try { await authService.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }))

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, handleOAuthCallback, logout, updateUser, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
