// The co-pilot phone on its dashboard mount. Same React component as the HUD phone, placed in 3D.
// Shown in cabin shots (POV / OTS); exterior shots use the HUD dock instead.
import { Html } from '@react-three/drei'
import { useRide } from '../engine/store'
import { PhoneScreen } from '../ui/PhoneScreen'
import { AUTO } from './kit'

export const phoneInWorld = (shotType: string) => shotType === 'POV' || shotType === 'OTS'

export function DashboardPhone() {
  // portrait screens keep the readable HUD phone instead
  const visible = useRide((s) => phoneInWorld(s.frame.shot.type) && s.started && window.innerWidth >= window.innerHeight)
  const openGrowth = () => useRide.setState({ overlay: { kind: 'growth' } })
  return (
    <group position={[...AUTO.phone]} rotation-y={Math.PI - 0.35} rotation-x={-0.2}>
      <mesh position={[0, 0, -0.008]}>
        <boxGeometry args={[0.085, 0.15, 0.012]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {visible && (
        <Html transform distanceFactor={0.42} zIndexRange={[5, 0]} style={{ pointerEvents: 'auto' }}>
          <PhoneScreen onCard={openGrowth} />
        </Html>
      )}
    </group>
  )
}
