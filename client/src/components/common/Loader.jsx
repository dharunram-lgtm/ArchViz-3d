export default function Loader({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }

  const spinner = (
    <div className={`${sizes[size]} relative`}>
      <div className="absolute inset-0 border-2 border-primary-200 dark:border-dark-400 rounded-full" />
      <div className="absolute inset-0 border-2 border-transparent border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-surface-500 dark:text-dark-200">Loading...</p>
        </div>
      </div>
    )
  }

  return spinner
}
