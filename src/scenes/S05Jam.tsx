// S5 Silk Board · rain. The 50 / 0 LED billboard glitches; the junction is a sea of tail-lights (Traffic.tsx).
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { getFrame } from '../engine/store'
import { MetroWorks } from '../world/props/Street'
import { Sign } from '../world/props/Sign'
import { useZ } from './common'

export default function S05Jam() {
  const [z, zEnd] = useZ(62, 90)
  const a = useRef<THREE.Group>(null)
  const b = useRef<THREE.Group>(null)
  useFrame(() => {
    const t = getFrame().t
    // glitch: mostly alternate every ~1.6 s, with stutters
    const phase = Math.floor(t / 1.6) % 2
    const stutter = Math.sin(t * 37) > 0.93
    if (a.current && b.current) {
      a.current.visible = (phase === 0) !== stutter
      b.current.visible = !a.current.visible
      b.current.position.x = stutter ? 0.15 : 0
    }
  })
  return (
    <group>
      <group position={[10, 9, z + 26]} rotation-y={-Math.PI / 2 + 0.3}>
        <mesh position={[0, -5, 0.4]}><boxGeometry args={[0.5, 10, 0.5]} /><meshStandardMaterial color="#333" /></mesh>
        <group ref={a}><Sign position={[0, 0, 0]} size={[12, 5]} bg="#050505" fg="#ffb000" glow="#ffb000" lit={2} lines={[{ text: 'EMAILS SENT', size: 150, font: 'mono' }, { text: '50', size: 300, font: 'mono' }]} /></group>
        <group ref={b}><Sign position={[0, 0, 0]} size={[12, 5]} bg="#050505" fg="#ff2a2a" glow="#ff2a2a" lit={2} lines={[{ text: 'REPLIES', size: 150, font: 'mono' }, { text: '0', size: 300, font: 'mono' }]} /></group>
      </group>
      <MetroWorks x={-12} z0={z - 40} z1={Math.max(z + 60, zEnd)} />
      <Sign position={[-14, 6, z + 40]} rotationY={Math.PI / 2} size={[8, 2]} bg="#0b3d2a" fg="#fff" lit={0.8} frame="#333" posts lines={[
        { text: '[FILL: ಕನ್ನಡ]', size: 120, font: 'kn' }, { text: 'SILK BOARD JN', size: 160, weight: 800 },
      ]} />
    </group>
  )
}
