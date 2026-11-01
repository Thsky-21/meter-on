// Kannada Rajyotsava flags (yellow over red) on the canopy's front corners, waving with speed.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { config } from '../../content/config'
import { getFrame } from '../../engine/store'

export function Flags() {
  const flags = useRef<THREE.Mesh[]>([])
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = config.auto.flags[1]
    g.fillRect(0, 0, 64, 32)
    g.fillStyle = config.auto.flags[0]
    g.fillRect(0, 32, 64, 32)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useFrame(() => {
    const f = getFrame()
    const k = 0.15 + Math.min(1, f.speed / 10) * 0.5
    flags.current.forEach((m, i) => { if (m) m.rotation.y = Math.PI / 2 + Math.sin(f.t * (6 + i) + i) * k })
  })
  return (
    <>
      {[0.64, -0.64].map((x, i) => (
        <group key={x} position={[x, 1.6, 0.86]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.36, 6]} />
            <meshStandardMaterial color="#ddd" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh ref={(m) => { if (m) flags.current[i] = m }} position={[0, 0.29, 0]}>
            <planeGeometry args={[0.2, 0.13]} />
            <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  )
}
