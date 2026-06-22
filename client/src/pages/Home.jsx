import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiGrid, FiEye, FiLayers, FiEdit3, FiCrosshair } from 'react-icons/fi'
import { BiBuilding, BiCube, BiPaint } from 'react-icons/bi'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { FiSun, FiMoon } from 'react-icons/fi'

const features = [
  { icon: BiCube, title: '3D Visualization', desc: 'Interactive Three.js viewer with orbit controls, walkthrough mode, and real-time rendering.' },
  { icon: FiLayers, title: 'Layer Management', desc: 'Toggle structural, furniture, electrical, plumbing, and ceiling layers independently.' },
  { icon: FiCrosshair, title: 'Measurement Tools', desc: 'Measure distances, calculate room areas, and add dimension labels to your model.' },
  { icon: FiEdit3, title: 'Annotations', desc: 'Add notes, comments, and pins anywhere on the 3D model. Collaborate with your team.' },
  { icon: BiPaint, title: 'Materials & Lighting', desc: 'Customize wall colors, floor textures, and simulate dynamic sunlight.' },
  { icon: FiEye, title: 'Walkthrough Mode', desc: 'Experience your design from the inside with first-person WASD controls.' },
]

export default function Home() {
  const { user } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-dark-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <BiBuilding size={20} className="text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-dark-50">ArchViz 3D</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-600 text-surface-600 dark:text-dark-100">
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-6">
              Powered by Three.js & React Three Fiber
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-surface-900 dark:text-dark-50 mb-6 leading-tight">
              Transform 2D Plans into{' '}
              <span className="text-gradient">Interactive 3D Worlds</span>
            </h1>
            <p className="text-xl text-surface-600 dark:text-dark-200 max-w-3xl mx-auto mb-10 leading-relaxed">
              Upload architectural floor plans and instantly visualize them as immersive 3D models.
              Navigate, measure, annotate, and collaborate in real-time.
            </p>
            <div className="flex items-center justify-center gap-4">
              {user ? (
                <Link to="/dashboard" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                  Go to Dashboard <FiArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                    Start Building <FiArrowRight size={20} />
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-surface-50 dark:bg-dark-800">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-dark-50 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-surface-600 dark:text-dark-200 max-w-2xl mx-auto">
              A complete toolkit for architects, designers, and builders to bring blueprints to life.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-dark-50 mb-2">{feature.title}</h3>
                <p className="text-surface-600 dark:text-dark-200 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-surface-200 dark:border-dark-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BiBuilding size={18} className="text-primary-600" />
            <span className="font-semibold text-surface-700 dark:text-dark-100">ArchViz 3D</span>
          </div>
          <p className="text-sm text-surface-500 dark:text-dark-200">
            Built with React, Three.js & Node.js
          </p>
        </div>
      </footer>
    </div>
  )
}
