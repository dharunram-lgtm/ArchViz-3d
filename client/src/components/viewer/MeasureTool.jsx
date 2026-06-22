import { useState, useEffect, useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'

function getShape(points) {
  const shape = new THREE.Shape()
  points.forEach((p, i) => {
    if (i === 0) shape.moveTo(p.x, p.z)
    else shape.lineTo(p.x, p.z)
  })
  shape.closePath()
  return shape
}

function calculateArea(points) {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].z
    area -= points[j].x * points[i].z
  }
  return Math.abs(area) / 2
}

function PointMarker({ position, index, color }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color={color} />
      <Text position={[0, 0.15, 0]} fontSize={0.15} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.02} outlineColor="#000">
        {index + 1}
      </Text>
    </mesh>
  )
}

function SavedMeasurement({ result }) {
  const { points, type, value } = result
  const color = type === 'distance' ? '#ff4444' : type === 'wall' ? '#ffaa00' : '#44ff44'

  if (type === 'area') {
    const mid = points.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(points.length)
    return (
      <group>
        <Line points={[...points, points[0]]} color={color} lineWidth={1.5} />
        <mesh>
          <shapeGeometry args={[getShape(points)]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Text position={[mid.x, mid.y + 0.2, mid.z]} fontSize={0.12} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.02} outlineColor="#000">
          {value.toFixed(2)}m²
        </Text>
      </group>
    )
  }

  const mid = new THREE.Vector3().addVectors(points[0], points[1]).multiplyScalar(0.5)
  return (
    <group>
      <Line points={points} color={color} lineWidth={1.5} />
      <Text position={[mid.x, mid.y + 0.2, mid.z]} fontSize={0.12} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.02} outlineColor="#000">
        {value.toFixed(2)}m
      </Text>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

export default function MeasureTool({ mode, active, onFinish }) {
  const { camera, gl, scene } = useThree()
  const [points, setPoints] = useState([])
  const [results, setResults] = useState([])
  const activeRef = useRef(active)
  const modeRef = useRef(mode)
  const pointsRef = useRef(points)

  useEffect(() => { activeRef.current = active }, [active])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { pointsRef.current = points }, [points])

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
    if (!active) {
      setPoints([])
      return
    }
    const canvas = gl.domElement

    const onClick = (event) => {
      const point = getIntersection(event)
      if (!point) return

      const mode = modeRef.current
      const currentPoints = [...pointsRef.current, point]
      setPoints(currentPoints)

      if (mode === 'distance' && currentPoints.length >= 2) {
        const dist = currentPoints[0].distanceTo(currentPoints[1])
        setResults(prev => [...prev, { type: 'distance', points: currentPoints, value: dist }])
        setPoints([])
        onFinish?.()
      } else if (mode === 'wall' && currentPoints.length >= 2) {
        const dist = currentPoints[0].distanceTo(currentPoints[1])
        setResults(prev => [...prev, { type: 'wall', points: currentPoints, value: dist }])
        setPoints([])
        onFinish?.()
      } else if (mode === 'area' && currentPoints.length >= 3) {
        const area = calculateArea(currentPoints)
        setResults(prev => [...prev, { type: 'area', points: currentPoints, value: area }])
        setPoints([])
        onFinish?.()
      }
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPoints([])
        onFinish?.()
      }
    }

    canvas.addEventListener('click', onClick)
    window.addEventListener('keydown', onKeyDown)
    canvas.style.cursor = 'crosshair'

    return () => {
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKeyDown)
      canvas.style.cursor = ''
    }
  }, [active, gl, scene, camera, getIntersection, onFinish])

  const activeColor = mode === 'distance' ? '#ff4444' : mode === 'wall' ? '#ffaa00' : '#44ff44'

  return (
    <group>
      {points.map((p, i) => (
        <PointMarker key={`dot-${i}`} position={p} index={i} color={activeColor} />
      ))}

      {mode === 'distance' && points.length === 1 && null}
      {mode === 'wall' && points.length === 1 && null}
      {mode === 'area' && points.length === 2 && (
        <Line points={[points[0], points[1]]} color={activeColor} lineWidth={1.5} />
      )}

      {results.map((r, i) => (
        <SavedMeasurement key={i} result={r} />
      ))}
    </group>
  )
}
