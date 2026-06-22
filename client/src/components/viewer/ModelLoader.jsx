import { useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

function ObjModel({ fileUrl }) {
  const obj = useLoader(OBJLoader, fileUrl)
  return <primitive object={obj} />
}

function GltfModel({ fileUrl }) {
  const gltf = useLoader(GLTFLoader, fileUrl)
  return <primitive object={gltf.scene} />
}

export default function ModelLoader({ fileUrl, fileType, visible = true }) {
  if (!visible) return null
  if (fileType === 'obj') return <ObjModel fileUrl={fileUrl} />
  if (fileType === 'glb' || fileType === 'gltf') return <GltfModel fileUrl={fileUrl} />
  return null
}
