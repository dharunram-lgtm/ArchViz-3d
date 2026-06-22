import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Sky, Html } from '@react-three/drei'
import { FiUpload, FiShare2, FiMaximize2, FiMinimize2, FiArrowLeft, FiLayers, FiCrosshair, FiMessageSquare, FiDroplet, FiCamera, FiNavigation2, FiTrash2 } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { projectService, uploadService, annotationService, materialService } from '../services/auth'
import Loader from '../components/common/Loader'
import ModelLoader from '../components/viewer/ModelLoader'
import MeasureTool from '../components/viewer/MeasureTool'
import AnnotationTool from '../components/viewer/AnnotationTool'
import WalkthroughControls from '../components/viewer/WalkthroughControls'

export default function ProjectView({ isShared = false }) {
  const { id, shareLink } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dark } = useTheme()
  const [project, setProject] = useState(null)
  const [material, setMaterial] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [activePanel, setActivePanel] = useState(null)
  const [layers, setLayers] = useState({ structural: true, furniture: true, electrical: false, plumbing: false, ceiling: true })
  const [uploading, setUploading] = useState(false)
  const [measureMode, setMeasureMode] = useState(null)
  const [annotationMode, setAnnotationMode] = useState(false)
  const [pendingAnnotation, setPendingAnnotation] = useState(null)
  const [walkthrough, setWalkthrough] = useState(false)
  const [uploadLayer, setUploadLayer] = useState('structural')
  const canvasRef = useRef()
  const controlsRef = useRef()
  const fileInputRef = useRef()

  const fetchProject = useCallback(async () => {
    setLoading(true)
    try {
      let res
      if (isShared) {
        res = await projectService.getShared(shareLink)
      } else {
        res = await projectService.getById(id)
      }
      setProject(res.data.project)
      setMaterial(res.data.material)
      setAnnotations(res.data.annotations || [])
      if (res.data.project.layers) setLayers(res.data.project.layers)
    } catch {
      toast.error('Failed to load project')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, shareLink, isShared, navigate])

  useEffect(() => { fetchProject() }, [fetchProject])

  const handleUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of files) {
        await uploadService.uploadBlueprint(project._id, file, uploadLayer)
      }
      toast.success(`${files.length} file(s) uploaded`)
      fetchProject()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleShare = async () => {
    try {
      const res = await projectService.share(project._id)
      navigator.clipboard.writeText(res.data.shareLink)
      toast.success('Share link copied!')
    } catch {
      toast.error('Failed to share')
    }
  }

  const handleExportScreenshot = () => {
    try {
      const gl = controlsRef.current?.gl
      if (!gl) { toast.error('Renderer not ready'); return }
      gl.domElement.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project?.name || 'screenshot'}.png`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Screenshot exported')
      }, 'image/png')
    } catch {
      toast.error('Failed to capture screenshot')
    }
  }

  const handleAnnotationAdd = (position) => {
    setPendingAnnotation(position)
  }

  const handleAnnotationConfirm = async (content) => {
    if (!content || !pendingAnnotation) return
    try {
      const res = await annotationService.create(project._id, {
        position: pendingAnnotation,
        content,
        type: 'note',
        color: '#ff6b35',
      })
      setAnnotations((prev) => [...prev, res.data.annotation])
      setPendingAnnotation(null)
      toast.success('Annotation added')
    } catch {
      toast.error('Failed to add annotation')
    }
  }

  const handleAnnotationDelete = async (annId) => {
    try {
      await annotationService.delete(annId)
      setAnnotations((prev) => prev.filter((a) => a._id !== annId))
      toast.success('Annotation deleted')
    } catch {
      toast.error('Failed to delete annotation')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  if (loading) return <Loader fullScreen />

  const panels = [
    { id: 'layers', icon: FiLayers, label: 'Layers' },
    { id: 'measure', icon: FiCrosshair, label: 'Measure' },
    { id: 'annotate', icon: FiMessageSquare, label: 'Annotate' },
    { id: 'materials', icon: FiDroplet, label: 'Materials' },
  ]

  return (
    <div className="h-[calc(100vh-4rem)] -m-4 md:-m-6 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-dark-700 border-b border-surface-200 dark:border-dark-400">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-500 text-surface-600 dark:text-dark-100">
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-semibold text-surface-900 dark:text-dark-50 text-sm">{project?.name}</h2>
            <p className="text-xs text-surface-500">{project?.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.dxf,.scad,.obj,.glb,.gltf" multiple onChange={handleUpload} className="hidden" />
          <div className="flex items-center gap-1">
            <select
              value={uploadLayer}
              onChange={(e) => setUploadLayer(e.target.value)}
              className="text-xs bg-surface-100 dark:bg-dark-500 border border-surface-200 dark:border-dark-400 rounded px-1.5 py-1 text-surface-700 dark:text-dark-100"
            >
              <option value="structural">Structural</option>
              <option value="furniture">Furniture</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="ceiling">Ceiling</option>
            </select>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-ghost text-sm flex items-center gap-1.5">
              <FiUpload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {!isShared && (
            <button onClick={handleShare} className="btn-ghost text-sm"><FiShare2 size={14} /></button>
          )}
          <button onClick={handleExportScreenshot} className="btn-ghost text-sm"><FiCamera size={14} /></button>
          <button onClick={toggleFullscreen} className="btn-ghost text-sm">
            {fullscreen ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        <div className="flex-1 relative bg-surface-100 dark:bg-dark-800">
          <Canvas
            shadows
            camera={{ position: [8, 6, 8], fov: 50 }}
            onCreated={(state) => { controlsRef.current = state }}
            onError={(e) => console.error('Canvas error:', e)}
          >
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={material?.lighting?.intensity || 1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <Sky
              distance={450000}
              sunPosition={[
                material?.lighting?.sunPosition?.azimuth || 45,
                material?.lighting?.sunPosition?.altitude || 60,
                0,
              ]}
              inclination={0.6}
              azimuth={0.25}
            />
            {project?.blueprints?.filter(b => ['obj','glb','gltf'].includes(b.fileType)).map(b => (
              <group key={b._id} visible={layers[b.layer || 'structural']}>
                <Suspense fallback={<Html center><div className="text-white text-sm">Loading 3D model...</div></Html>}>
                  <ModelLoader fileUrl={b.fileUrl} fileType={b.fileType} />
                </Suspense>
              </group>
            ))}
            {measureMode && (
              <MeasureTool mode={measureMode} active={true} onFinish={() => setMeasureMode(null)} />
            )}
            <AnnotationTool
              active={annotationMode}
              annotations={annotations}
              onAnnotationAdd={handleAnnotationAdd}
            />
            {walkthrough ? (
              <WalkthroughControls enabled={walkthrough} onUnlock={() => setWalkthrough(false)} />
            ) : (
              <OrbitControls
                enableDamping
                dampingFactor={0.1}
                minDistance={2}
                maxDistance={Infinity}
                maxPolarAngle={Math.PI / 2.1}
              />
            )}
            <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={20} blur={2} />
            <Environment preset="sunset" />
          </Canvas>

          {pendingAnnotation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="glass-dark rounded-xl p-3 flex items-center gap-2 shadow-lg">
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter annotation text..."
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white placeholder-white/60 text-sm w-64 outline-none border border-white/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      handleAnnotationConfirm(e.target.value)
                      e.target.value = ''
                    }
                    if (e.key === 'Escape') {
                      setPendingAnnotation(null)
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleAnnotationConfirm(e.target.value)
                      e.target.value = ''
                    } else {
                      setPendingAnnotation(null)
                    }
                  }}
                />
                <button
                  onClick={() => setPendingAnnotation(null)}
                  className="text-white/60 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 glass-dark rounded-xl p-1">
            {panels.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActivePanel(activePanel === id ? null : id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activePanel === id
                    ? 'bg-primary-600 text-white'
                    : 'text-dark-100 hover:bg-dark-500'
                }`}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button
              onClick={() => setWalkthrough((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                walkthrough
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-100 hover:bg-dark-500'
              }`}
              title={walkthrough ? 'Exit walkthrough (Esc)' : 'Walkthrough mode'}
            >
              <FiNavigation2 size={16} />
              <span className="hidden md:inline">Walk</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white dark:bg-dark-700 border-l border-surface-200 dark:border-dark-400 overflow-hidden"
            >
              <div className="w-[280px] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-900 dark:text-dark-50 capitalize">{activePanel}</h3>
                  <button onClick={() => setActivePanel(null)} className="text-surface-400 hover:text-surface-600">✕</button>
                </div>

                {activePanel === 'layers' && (
                  <div className="space-y-3">
                    {Object.entries(layers).map(([key, val]) => (
                      <label key={key} className="flex items-center justify-between py-2">
                        <span className="text-sm text-surface-700 dark:text-dark-100 capitalize">{key}</span>
                        <button
                          onClick={() => setLayers((prev) => ({ ...prev, [key]: !val }))}
                          className={`w-10 h-5 rounded-full transition-colors relative ${
                            val ? 'bg-primary-600' : 'bg-surface-300 dark:bg-dark-400'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                            val ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </label>
                    ))}
                  </div>
                )}

                {activePanel === 'materials' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-surface-700 dark:text-dark-100 block mb-1">Wall Color</label>
                        <input
                          type="color" value={(material?.walls?.color) || '#e8e0d8'}
                          onChange={(e) => setMaterial((prev) => ({ walls: { color: e.target.value }, floors: prev?.floors || { color: '#c4b8a8' }, lighting: prev?.lighting || { intensity: 1 } }))}
                          className="w-full h-10 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-surface-700 dark:text-dark-100 block mb-1">Floor Color</label>
                        <input
                          type="color" value={(material?.floors?.color) || '#c4b8a8'}
                          onChange={(e) => setMaterial((prev) => ({ floors: { color: e.target.value }, walls: prev?.walls || { color: '#e8e0d8' }, lighting: prev?.lighting || { intensity: 1 } }))}
                          className="w-full h-10 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-surface-700 dark:text-dark-100 block mb-1">Lighting Intensity</label>
                        <input
                          type="range" min="0" max="3" step="0.1"
                          value={(material?.lighting?.intensity) ?? 1}
                          onChange={(e) => setMaterial((prev) => ({ lighting: { intensity: parseFloat(e.target.value) }, walls: prev?.walls || { color: '#e8e0d8' }, floors: prev?.floors || { color: '#c4b8a8' } }))}
                          className="w-full"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await materialService.update(project._id, {
                              walls: { color: material?.walls?.color || '#e8e0d8' },
                              floors: { color: material?.floors?.color || '#c4b8a8' },
                              lighting: { intensity: material?.lighting?.intensity ?? 1 },
                            })
                          toast.success('Materials updated')
                        } catch {
                          toast.error('Failed to update')
                        }
                      }}
                      className="btn-primary w-full text-sm"
                    >
                      Apply Changes
                    </button>
                  </div>
                )}

                {activePanel === 'annotate' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setAnnotationMode((prev) => !prev)}
                      className={`btn-${annotationMode ? 'primary' : 'secondary'} w-full text-sm`}
                    >
                      {annotationMode ? 'Click model to add annotation' : 'Enable Annotation Mode'}
                    </button>
                    {annotations.length === 0 ? (
                      <p className="text-sm text-surface-400">No annotations yet</p>
                    ) : (
                      annotations.map((ann) => (
                        <div key={ann._id} className="p-3 rounded-lg bg-surface-50 dark:bg-dark-500 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm text-surface-700 dark:text-dark-100 break-words">{ann.content}</p>
                            <p className="text-xs text-surface-400 mt-1">{ann.user?.name}</p>
                            {ann.position && (
                              <p className="text-xs text-surface-400 font-mono mt-0.5">
                                {ann.position.x?.toFixed(2)}, {ann.position.y?.toFixed(2)}, {ann.position.z?.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAnnotationDelete(ann._id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-400 hover:text-red-500 shrink-0"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activePanel === 'measure' && (
                  <div className="space-y-4">
                    <p className="text-sm text-surface-500 dark:text-dark-200">
                      Use the measurement tools to calculate distances and areas.
                    </p>
                    <button onClick={() => setMeasureMode(measureMode === 'distance' ? null : 'distance')} className={`btn-${measureMode === 'distance' ? 'primary' : 'secondary'} w-full text-sm`}>
                      {measureMode === 'distance' ? 'Click model to measure' : 'Measure Distance'}
                    </button>
                    <button onClick={() => setMeasureMode(measureMode === 'area' ? null : 'area')} className={`btn-${measureMode === 'area' ? 'primary' : 'secondary'} w-full text-sm`}>
                      {measureMode === 'area' ? 'Click 3 points to measure area' : 'Calculate Area'}
                    </button>
                    <button onClick={() => setMeasureMode(measureMode === 'wall' ? null : 'wall')} className={`btn-${measureMode === 'wall' ? 'primary' : 'secondary'} w-full text-sm`}>
                      {measureMode === 'wall' ? 'Click model to measure' : 'Wall Length'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
