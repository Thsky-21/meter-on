// S3 Startup capital · night. Welcome gantry, plain-text college gate (hotspot), circuit traces racing the auto.
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { getFrame } from '../engine/store'
import { Sign } from '../world/props/Sign'
import { hotspotClick, useZ } from './common'

export default function S03Startup() {
  const [zSign, zGate, z0, z1] = useZ(30.5, 35, 31, 40.5)
  const traces = useRef<THREE.Group>(null)
  useFrame(() => {
    const f = getFrame()
    traces.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
      const on = f.t > 31 && f.t < 41 ? 1 : 0
      m.opacity = on * (0.5 + 0.5 * Math.sin(f.t * 6 - i * 0.7)) * (0.4 + f.activity * 0.6)
    })
  })
  const len = Math.max(20, z1 - z0)
  return (
    <group>
      {/* gantry across the road */}
      <group position={[0, 0, zSign + 20]}>
        {[6.2, -6.2].map((x) => (
          <mesh key={x} position={[x, 3.6, 0]}><boxGeometry args={[0.35, 7.2, 0.35]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.4} /></mesh>
        ))}
        <Sign position={[0, 6.4, 0]} rotationY={Math.PI} size={[11.5, 2.2]} bg="#0b3d2a" fg="#f4f1ea" frame="#333" lit={1.2} lines={[
          { text: '[FILL: ಕನ್ನಡ welcome line]', size: 90, font: 'kn' },
          { text: 'Welcome to the startup capital', size: 110, weight: 800 },
        ]} />
      </group>
      {/* college gate: plain text, no logo */}
      <group position={[8.5, 0, zGate + 12]} onClick={hotspotClick('startup', 'college-gate')}>
        {[-3.2, 3.2].map((z) => (
          <mesh key={z} position={[0, 2.6, z]} castShadow><boxGeometry args={[1, 5.2, 1]} /><meshStandardMaterial color="#b9ad98" roughness={0.9} /></mesh>
        ))}
        <mesh position={[0, 5.5, 0]}><boxGeometry args={[1.1, 0.9, 7.6]} /><meshStandardMaterial color="#8f8473" roughness={0.9} /></mesh>
        <Sign position={[-0.6, 5.5, 0]} rotationY={-Math.PI / 2} size={[6.6, 0.75]} fg="#fff3d0" lit={1.4} lines={[{ text: 'M S R I T', size: 200, weight: 800 }]} />
      </group>
      {/* circuit traces along the lane markings */}
      <group ref={traces} position={[0, 0.03, z0 + len / 2]}>
        {[-3.4, -1.7, 0, 1.7, 3.4].map((x, i) => (
          <mesh key={x} position={[x, 0, (i % 2) * 2]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.08, len]} />
            <meshBasicMaterial color={new THREE.Color('#22e1ff').multiplyScalar(3)} transparent toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
