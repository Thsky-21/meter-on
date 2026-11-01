// "Words as light": the clean line settles on the windshield, projected and glowing.
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useRide } from '../engine/store'
import { textTexture } from './kit'

export function WindshieldCaption() {
  const text = useRide((s) => s.frame.windshield?.line.cleanText ?? null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const tex = useMemo(() => (text ? textTexture({ w: 1024, h: 256, fg: '#ffffff', glow: '#9fe8ff', lines: wrap(text) }) : null), [text])
  useEffect(() => () => tex?.dispose(), [tex])
  useFrame(() => {
    const w = useRide.getState().frame.windshield
    if (mat.current) mat.current.opacity = w ? Math.min(1, 0.2 + w.p * 1.2) * 0.85 : 0
  })
  if (!tex) return null
  return (
    <mesh position={[0, 1.36, 1.0]} rotation-y={Math.PI} rotation-x={0.08}>
      <planeGeometry args={[0.9, 0.225]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function wrap(text: string) {
  const lines: string[] = []
  let cur = ''
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > 30) { lines.push(cur.trim()); cur = w } else cur += ' ' + w
  }
  lines.push(cur.trim())
  const size = lines.length > 2 ? 56 : 72
  return lines.slice(0, 3).map((l) => ({ text: l, size, weight: 700 }))
}
