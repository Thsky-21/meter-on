// S7 Voice, from the silicon up · pre-dawn. The chip city is MacroWorld; here: three lanes merge into one highway.
import * as THREE from 'three'
import { Sign } from '../world/props/Sign'
import { useZ } from './common'

const LANES = [
  { label: 'Chip & mic', color: '#14f1d9', x: -6 },
  { label: 'AI voice agents', color: '#8f7aff', x: 0 },
  { label: 'People who speak', color: '#ffd28a', x: 6 },
]

export default function S07Voice() {
  const [z] = useZ(117)
  return (
    <group position={[0, 0.04, z]}>
      {LANES.map((l) => {
        const len = 70
        const angle = Math.atan2(-l.x, len)
        return (
          <group key={l.label}>
            <mesh position={[l.x / 2, 0, len / 2]} rotation-x={-Math.PI / 2} rotation-z={angle}>
              <planeGeometry args={[0.5, Math.hypot(len, l.x)]} />
              <meshBasicMaterial color={new THREE.Color(l.color).multiplyScalar(2.5)} toneMapped={false} />
            </mesh>
            <group position={[l.x, 0.02, 8]} rotation-x={-Math.PI / 2}>
              <Sign position={[0, 0, 0]} size={[5, 1.2]} fg={l.color} glow={l.color} lit={2} lines={[{ text: l.label, size: 150, weight: 800 }]} />
            </group>
          </group>
        )
      })}
      <mesh position={[0, 0, 110]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.8, 80]} />
        <meshBasicMaterial color={new THREE.Color('#ffffff').multiplyScalar(2.5)} toneMapped={false} />
      </mesh>
    </group>
  )
}
