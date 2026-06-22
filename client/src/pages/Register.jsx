import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiGithub } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth'
import { BiBuilding } from 'react-icons/bi'

export default function Register() {
  const { register, handleOAuthCallback } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'google_not_configured' || error === 'github_not_configured') {
      toast.error(`${error.split('_')[0]} OAuth is not configured.`)
    } else if (error === 'google_auth_failed' || error === 'github_auth_failed') {
      toast.error(`${error.split('_')[0]} authentication failed. Please try again.`)
    } else if (error === 'auth_failed') {
      toast.error('Authentication failed. Please try again.')
    }
  }, [searchParams])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [devEmail, setDevEmail] = useState('')
  const [devLoading, setDevLoading] = useState(false)
  const showDev = searchParams.get('error') === 'google_not_configured'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDevLogin = async () => {
    if (!devEmail) {
      toast.error('Enter an email address')
      return
    }
    setDevLoading(true)
    try {
      const res = await authService.devGoogleLogin(devEmail)
      handleOAuthCallback(res.data.token, res.data.refreshToken, res.data.user)
      toast.success('Dev login successful!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dev login failed')
    } finally {
      setDevLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <BiBuilding size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-dark-50">ArchViz 3D</span>
          </Link>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-dark-50 mb-2">Create Account</h1>
          <p className="text-surface-600 dark:text-dark-200">Start bringing your blueprints to life</p>
        </div>

        <div className="card p-6 space-y-4">
          {showDev && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-2">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">⚡ Dev Mode — Google OAuth not configured</p>
              <div className="flex gap-2">
                <input
                  type="email" value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="input-field flex-1 text-sm py-1.5"
                />
                <button onClick={handleDevLogin} disabled={devLoading}
                  className="btn-primary text-sm px-3 py-1.5 whitespace-nowrap">
                  {devLoading ? '...' : 'Dev Login'}
                </button>
              </div>
            </div>
          )}
          <button className="btn-google w-full" onClick={() => window.location.href = '/api/auth/google'}>
            <FcGoogle size={20} /> Sign up with Google
          </button>
          <button onClick={() => window.location.href = '/api/auth/github'} className="btn-github w-full">
            <FiGithub size={20} /> Sign up with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-dark-400" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-dark-600 text-surface-500">Or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-dark-100 mb-1.5">Name</label>
              <div className="relative">
                <FiUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-dark-100 mb-1.5">Email</label>
              <div className="relative">
                <FiMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-dark-100 mb-1.5">Password</label>
              <div className="relative">
                <FiLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-surface-600 dark:text-dark-200">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
