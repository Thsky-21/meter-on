// Street furniture: darshini (with steam), metro barricades and pillars, temple lamp, traffic signal.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getFrame } from '../../engine/store'
import { rand } from '../kit'
import { Sign } from './Sign'

type V3 = [number, number, number]

/** A darshini: open-front eatery, warm light, filter-coffee steam. `closing` pulls the shutter half down. */
export function Darshini({ position, rotationY = 0, closing = false }: { position: V3; rotationY?: number; closing?: boolean }) {
  const steam = useRef<THREE.InstancedMesh>(null)
  const o = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    if (!steam.current) return
    const t = getFrame().t
    for (let i = 0; i < 14; i++) {
      const life = (t * 0.35 + rand(3, i)) % 1
      o.position.set(-0.6 + rand(4, i) * 0.5 + Math.sin(t + i) * 0.1 * life, 1.15 + life * 1.6, 1.0)
      o.scale.setScalar(0.12 + life * 0.35)
      o.updateMatrix()
      steam.current.setMatrixAt(i, o.matrix)
    }
    steam.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={position} rotation-y={rotationY}>
      {/* building block */}
      <mesh position={[0, 2.2, -1.5]} castShadow receiveShadow>
        <boxGeometry args={[6, 4.4, 3]} />
        <meshStandardMaterial color="#c8b48f" roughness={0.9} />
      </mesh>
      {/* lit interior */}
      <mesh position={[0, 1.3, 0.02]}>
        <planeGeometry args={[5.4, 2.4]} />
        <meshBasicMaterial color={new THREE.Color('#ffb768').multiplyScalar(closing ? 0.6 : 1.4)} toneMapped={false} />
      </mesh>
      {/* shutter */}
      <mesh position={[0, closing ? 2.0 : 2.45, 0.05]}>
        <boxGeometry args={[5.5, closing ? 1.5 : 0.6, 0.05]} />
        <meshStandardMaterial color="#6f6a63" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* counter + coffee */}
      <mesh position={[0, 0.55, 0.6]} castShadow>
        <boxGeometry args={[5, 1.1, 0.8]} />
        <meshStandardMaterial color="#8a4f2a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.4, 1.2, 0.8]}>
        <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
        <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.2} />
      </mesh>
      <instancedMesh ref={steam} args={[undefined, undefined, 14]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
      </instancedMesh>
      <Sign position={[0, 3.6, 0.06]} size={[5.6, 1.2]} bg="#1f6b3a" fg="#fff7d6" lines={[
        { text: '[FILL: ಕನ್ನಡ name]', size: 120, font: 'kn' },
        { text: 'DARSHINI · FILTER COFFEE', size: 110, weight: 800 },
      ]} />
    </group>
  )
}

/** Metro construction: barricades along the median and big concrete pillars. */
export function MetroWorks({ x, z0, z1 }: { x: number; z0: number; z1: number }) {
  const n = Math.max(1, Math.floor((z1 - z0) / 2.2))
  const pillars = Math.max(1, Math.floor((z1 - z0) / 28))
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[x, 0, z0 + i * 2.2]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.12, 1.1, 2.1]} />
            <meshStandardMaterial color={i % 2 ? '#e8e3d6' : '#c9372c'} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.14, 0.12, 2.1]} />
            <meshStandardMaterial color="#f2c230" emissive="#f2c230" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: pillars }, (_, i) => (
        <group key={i} position={[x - 1.2, 0, z0 + 10 + i * 28]}>
          <mesh position={[0, 5, 0]} castShadow>
            <cylinderGeometry args={[1.1, 1.1, 10, 20]} />
            <meshStandardMaterial color="#9e9a93" roughness={0.9} />
          </mesh>
          <mesh position={[0, 10.6, 0]} castShadow>
            <boxGeometry args={[6, 1.2, 3]} />
            <meshStandardMaterial color="#a8a49c" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** A small roadside shrine with a lamp (diya) glow. */
export function TempleLamp({ position }: { position: V3 }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => { if (light.current) light.current.intensity = 6 + Math.sin(getFrame().t * 9) * 1.5 })
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.4, 1.8, 1.2]} />
        <meshStandardMaterial color="#e9e1cf" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <coneGeometry args={[0.9, 1.2, 4]} />
        <meshStandardMaterial color="#c1532f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.0, 0.61]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color={new THREE.Color('#ffb347').multiplyScalar(4)} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 1.1, 0.9]} color="#ffae4a" distance={6} />
    </group>
  )
}

/** Traffic signal on a pole, red light lit. */
export function Signal({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 5, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[0.4, 1.1, 0.35]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {['#ff2a2a', '#3a2a00', '#002a10'].map((c, i) => (
        <mesh key={c} position={[0, 5.55 - i * 0.34, -0.18]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color={i === 0 ? new THREE.Color(c).multiplyScalar(4) : c} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
