import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import * as THREE from 'three'

export default function WalkthroughControls({ enabled, onUnlock }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keysRef = useRef({})
  const velocityRef = useRef(new THREE.Vector3())
  const directionRef = useRef(new THREE.Vector3())
  const onUnlockRef = useRef(onUnlock)

  onUnlockRef.current = onUnlock

  useEffect(() => {
    if (!enabled) return

    const handleUnlock = () => {
      if (onUnlockRef.current) onUnlockRef.current()
    }

    document.addEventListener('pointerlockchange', handleUnlock)

    const controls = new PointerLockControls(camera, gl.domElement)
    controlsRef.current = controls
    controls.lock()

    const onKeyDown = (e) => { keysRef.current[e.code] = true }
    const onKeyUp = (e) => { keysRef.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      document.removeEventListener('pointerlockchange', handleUnlock)
      controls.unlock()
      controls.dispose()
      controlsRef.current = null
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      keysRef.current = {}
    }
  }, [enabled, camera, gl])

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls || !controls.isLocked) return

    const keys = keysRef.current
    const velocity = velocityRef.current
    const direction = directionRef.current

    velocity.x *= 0.85
    velocity.z *= 0.85

    direction.z = Number(keys['KeyW']) - Number(keys['KeyS'])
    direction.x = Number(keys['KeyD']) - Number(keys['KeyA'])
    if (direction.length() > 0) direction.normalize()

    const speed = 5
    if (keys['KeyW'] || keys['KeyS']) velocity.z -= direction.z * speed * 0.02
    if (keys['KeyD'] || keys['KeyA']) velocity.x -= direction.x * speed * 0.02

    controls.moveRight(-velocity.x)
    controls.moveForward(-velocity.z)
  })

  return null
}
