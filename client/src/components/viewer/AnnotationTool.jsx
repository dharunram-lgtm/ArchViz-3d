import { useState, useEffect, useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

function AnnotationMarker({ position, content, color }) {
  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color || '#ff6b35'} />
      </mesh>
      <Text
        position={[0, 0.2, 0]}
        fontSize={0.08}
        color={color || '#ff6b35'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000"
        maxWidth={2}
      >
        {content}
      </Text>
    </group>
  )
}

export default function AnnotationTool({ active, annotations, onAnnotationAdd }) {
  const { camera, gl, scene } = useThree()
  const activeRef = useRef(active)

  useEffect(() => { activeRef.current = active }, [active])

  const getIntersection = useCallback((event) => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(x, y)
    raycaster.setFromCamera(mouse, camera)
    const meshes = []
    const seen = new Set()
    scene.traverse((child) => {
      if (child.isMesh && !seen.has(child.geometry?.uuid)) {
        meshes.push(child)
        seen.add(child.geometry?.uuid)
      }
    })
    const hits = raycaster.intersectObjects(meshes, true)
    return hits.length > 0 ? hits[0].point.clone() : null
  }, [camera, gl, scene])

  useEffect(() => {
    if (!active) return
    const canvas = gl.domElement

    const onClick = (event) => {
      const point = getIntersection(event)
      if (!point) return
      onAnnotationAdd({ x: point.x, y: point.y, z: point.z })
    }

    canvas.addEventListener('click', onClick)
    canvas.style.cursor = 'crosshair'

    return () => {
      canvas.removeEventListener('click', onClick)
      canvas.style.cursor = ''
    }
  }, [active, gl, scene, camera, getIntersection, onAnnotationAdd])

  return (
    <group>
      {annotations.map((ann) => (
        <AnnotationMarker
          key={ann._id}
          position={ann.position}
          content={ann.content}
          color={ann.color}
        />
      ))}
    </group>
  )
}
