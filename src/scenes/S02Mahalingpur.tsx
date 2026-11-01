// S2 Mahalingpur · dusk → golden hour. Fields, distant hills ([FILL: landmark]), the painted wall hotspot.
import { useMemo } from 'react'
import { Sign } from '../world/props/Sign'
import { rand } from '../world/kit'
import { hotspotClick, useZ } from './common'

export default function S02Mahalingpur() {
  const [z0, zWall] = useZ(16, 26)
  const hills = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: -160 + i * 40 + rand(1, i) * 20, h: 18 + rand(2, i) * 30, r: 40 + rand(3, i) * 30 })), [])
  return (
    <group>
      {/* distant hills; [FILL: landmark] goes here */}
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, 0, z0 + 380]} scale={[h.r, h.h, h.r * 0.6]}>
          <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7a5a45" roughness={1} />
        </mesh>
      ))}
      {/* crop rows */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[(i % 2 ? -1 : 1) * (12 + (i >> 1) * 4), 0.2, z0 + 60]} castShadow>
          <boxGeometry args={[1.4, 0.4, 160]} />
          <meshStandardMaterial color={i % 3 ? '#a8933d' : '#6f7a2c'} roughness={1} />
        </mesh>
      ))}
      {/* rural painted wall: hotspot */}
      <group position={[6.5, 0, zWall + 14]} rotation-y={-Math.PI / 2}>
        <mesh position={[0, 1.4, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[9, 2.8, 0.35]} />
          <meshStandardMaterial color="#efe6d2" roughness={1} />
        </mesh>
        <Sign position={[0, 1.45, 0]} size={[8.4, 2.3]} fg="#1d4fa0" lines={[
          { text: 'Mahalingpur · 2005', size: 150, weight: 800 },
          { text: '[FILL: ಕನ್ನಡ]', size: 90, font: 'kn', color: '#b2261f' },
        ]} onClick={hotspotClick('mahalingpur', 'painted-wall')} />
      </group>
    </group>
  )
}
