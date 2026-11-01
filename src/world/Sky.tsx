// Sky, the driver: stylized, hoodie, earphones around the neck, hands on the handlebar.
// Face is minimal (no mouth); usually seen from behind or backlit. GLB swap via assets.models.sky.
import { Gltf } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { assets } from '../content/assets'
import { getFrame } from '../engine/store'

/** [DECIDE] Sky's colours */
export const SKY_LOOK = { hoodie: '#2c3e5c', skin: '#8f5f3f', hair: '#141110', earphones: '#f2f2f2' }

const smooth = (a: number, b: number, t: number) => {
  const p = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return p * p * (3 - 2 * p)
}

export function Sky() {
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!torso.current || !head.current) return
    const f = getFrame()
    const t = f.t
    const sway = Math.sin(t * 1.3) * 0.02 + Math.sin(t * 0.7) * 0.015
    // turn-around at the fare (140 → 142.5), stays turned through the fare
    const turn = smooth(140, 142.5, t) * (1 - smooth(169, 171, t))
    torso.current.rotation.y = sway + turn * 2.4
    torso.current.rotation.z = Math.sin(t * 1.1) * 0.01
    // glance up to the mirror in MIRROR shots, otherwise watch the road
    const mirror = f.shot.type === 'MIRROR' ? 1 : 0
    head.current.rotation.x = -0.1 * mirror + Math.sin(t * 0.9) * 0.02
    head.current.rotation.y = Math.sin(t * 0.37) * 0.12 * (1 - mirror) + turn * 0.5
  })
  if (assets.models.sky) {
    return <Suspense fallback={null}><Gltf src={assets.models.sky} position={[0, 0.8, 0.32]} /></Suspense>
  }
  const hoodie = <meshStandardMaterial color={SKY_LOOK.hoodie} roughness={0.85} />
  const skin = <meshStandardMaterial color={SKY_LOOK.skin} roughness={0.6} />
  return (
    <group position={[0, 0.84, 0.32]}>
      <group ref={torso}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <capsuleGeometry args={[0.17, 0.26, 6, 14]} />
          {hoodie}
        </mesh>
        {/* hood bunched at the back of the neck */}
        <mesh position={[0, 0.5, -0.08]} rotation-x={0.6} scale={[1, 0.6, 1]}>
          <torusGeometry args={[0.1, 0.05, 8, 16]} />
          {hoodie}
        </mesh>
        {/* earphones around the neck */}
        <mesh position={[0, 0.5, 0.01]} rotation-x={Math.PI / 2 - 0.25}>
          <torusGeometry args={[0.095, 0.007, 6, 24]} />
          <meshStandardMaterial color={SKY_LOOK.earphones} />
        </mesh>
        {[0.06, -0.06].map((x) => (
          <mesh key={x} position={[x, 0.44, 0.1]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color={SKY_LOOK.earphones} />
          </mesh>
        ))}
        {/* arms reaching the handlebar grips */}
        {[1, -1].map((s) => (
          <group key={s} position={[0.18 * s, 0.42, 0.02]}>
            <mesh position={[0.04 * s, -0.08, 0.2]} rotation-x={1.1} rotation-z={-0.12 * s}>
              <capsuleGeometry args={[0.05, 0.34, 4, 10]} />
              {hoodie}
            </mesh>
            <mesh position={[0.1 * s, -0.24, 0.44]}>
              <sphereGeometry args={[0.04, 10, 10]} />
              {skin}
            </mesh>
          </group>
        ))}
        <group ref={head} position={[0, 0.6, 0]}>
          <mesh castShadow scale={[0.95, 1.08, 1]}>
            <sphereGeometry args={[0.105, 24, 20]} />
            {skin}
          </mesh>
          <mesh position={[0, 0.03, -0.012]} scale={[1.02, 0.95, 1.04]}>
            <sphereGeometry args={[0.106, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={SKY_LOOK.hair} roughness={0.9} />
          </mesh>
          {/* minimal face: two soft eyes, no mouth */}
          {[0.035, -0.035].map((x) => (
            <mesh key={x} position={[x, 0.005, 0.095]} scale={[1, 0.6, 0.4]}>
              <sphereGeometry args={[0.013, 10, 8]} />
              <meshStandardMaterial color="#120c08" roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
