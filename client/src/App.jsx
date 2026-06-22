import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import AdminLayout from './components/layout/AdminLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProjectView from './pages/ProjectView'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import OAuthCallback from './components/auth/OAuthCallback'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/shared/:shareLink" element={<ProjectView isShared />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/project/:id" element={<ProjectView />} />
            </Route>
          </Route>
          <Route path="/admin" element={<ProtectedRoute adminOnly />}>
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<Admin />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
