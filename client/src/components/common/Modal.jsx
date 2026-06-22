import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef()

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizes[size]} bg-white dark:bg-dark-600 rounded-2xl shadow-2xl border border-surface-200 dark:border-dark-400`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-dark-400">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-dark-50">{title}</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-500 text-surface-500 transition-colors">
                  <FiX size={20} />
                </button>
              </div>
            )}
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-custom">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
