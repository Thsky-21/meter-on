// S11 Trip log · sunrise. The voice skyline: buildings generated from the ride's voice-activity envelope
// (~120 buildings), laid along the route and seen from the rising drone.
import { useMemo } from 'react'
import * as THREE from 'three'
import { useRide } from '../engine/store'
import { activityFromWords } from '../engine/voiceActivity'
import { useZ } from './common'

export function voiceEnvelope(n = 120) {
  const ride = useRide.getState().ride
  return Array.from({ length: n }, (_, i) => {
    let peak = 0
    const t0 = (i / n) * 140, t1 = ((i + 1) / n) * 140
    for (let t = t0; t < t1; t += 0.1) peak = Math.max(peak, activityFromWords(ride.voiced, t))
    return peak
  })
}

export default function S11TripLog() {
  const ride = useRide((s) => s.ride)
  const [z] = useZ(170)
  const env = useMemo(() => voiceEnvelope(), [ride]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group position={[0, 0, z + 40]}>
      {env.map((a, i) => {
        const h = 2 + a * 30 + ((i * 7) % 5)
        return (
          <mesh key={i} position={[-30 + (i / env.length) * 60, h / 2, 50 + (i % 3) * 3]} castShadow>
            <boxGeometry args={[0.45, h, 2]} />
            <meshStandardMaterial color="#2b2030" emissive={new THREE.Color('#ffb36b')} emissiveIntensity={a * 0.6} roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}
