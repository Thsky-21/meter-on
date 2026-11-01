// S8 Stickers · pre-dawn. Stopped at a signal behind another auto; three value stickers peel on as each
// line plays. Tap a sticker to collect it.
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { config } from '../content/config'
import { collectSticker, getFrame, useRide } from '../engine/store'
import { Signal } from '../world/props/Street'
import { Sign } from '../world/props/Sign'
import { laneAt, useZ } from './common'

const STICKER_COLS = ['#f2c230', '#14d1c0', '#ff6b4a']

export default function S08Stickers() {
  const [z] = useZ(121)
  const ride = useRide((s) => s.ride)
  const collected = useRide((s) => s.stickers)
  const lines = ride.phoneLines.filter((l) => l.sticker)
  const refs = useRef<THREE.Group[]>([])
  useFrame(() => {
    const t = getFrame().t
    lines.forEach((l, i) => {
      const g = refs.current[i]
      if (!g) return
      // peel on: rotate in from a curled corner over 0.6 s from the line's start
      const p = THREE.MathUtils.clamp((t - l.wordStart) / 0.6, 0, 1)
      const e = 1 - Math.pow(1 - p, 3)
      g.visible = p > 0
      g.rotation.set(0, Math.PI, (1 - e) * 0.9)
      g.scale.setScalar(0.3 + e * 0.7)
    })
  })
  const x = laneAt(121)
  return (
    <group>
      <group position={[x, 0, z + 5.6]}>
        {/* the other auto (simple) */}
        <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[1.3, 1.0, 2.4]} /><meshStandardMaterial color={config.auto.paint.lower} roughness={0.4} /></mesh>
        <mesh position={[0, 1.55, 0]}><boxGeometry args={[1.4, 0.7, 2.5]} /><meshStandardMaterial color={config.auto.paint.canopy} roughness={0.8} /></mesh>
        <mesh position={[0, 1.05, -1.22]}><boxGeometry args={[1.3, 0.9, 0.04]} /><meshStandardMaterial color={config.auto.paint.upper} roughness={0.5} /></mesh>
        {[0.5, -0.5].map((tx) => (
          <mesh key={tx} position={[tx, 0.55, -1.23]}><boxGeometry args={[0.14, 0.08, 0.02]} /><meshBasicMaterial color={new THREE.Color('#ff1a1a').multiplyScalar(3)} toneMapped={false} /></mesh>
        ))}
        {lines.map((l, i) => (
          <group key={l.id} ref={(g) => { if (g) refs.current[i] = g }} position={[-0.38 + i * 0.38, 1.1, -1.25]}>
            <Sign position={[0, 0, 0]} size={[0.34, 0.34]} bg={STICKER_COLS[i]} fg="#1b1300" border={collected.includes(l.sticker!) ? '#ffffff' : undefined}
              lines={[{ text: l.cleanText.replace(/^\[FILL: (.*)\]$/, '$1'), size: 150, weight: 800 }]}
              onClick={() => collectSticker(l.sticker!)} />
          </group>
        ))}
      </group>
      <Signal position={[-3.4, 0, z + 14]} rotationY={Math.PI} />
    </group>
  )
}
