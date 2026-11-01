// Phase 1 stand-in: a coloured block per scene, a road with markers so motion reads, a box for the auto.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { config } from '../content/config'
import { getFrame } from '../engine/store'
import { scenes } from '../engine/timeline'
import { MACRO_ORIGIN } from '../camera/CameraRig'

export function PlaceholderWorld() {
  const auto = useRef<THREE.Group>(null)
  const led = useRef<THREE.MeshStandardMaterial>(null)
  const ground = useRef<THREE.MeshStandardMaterial>(null)
  const block = useRef<THREE.Mesh>(null)
  const blockMat = useRef<THREE.MeshStandardMaterial>(null)
  const markers = useMemo(() => Array.from({ length: 60 }, (_, i) => i * 6), [])
  const markerGroup = useRef<THREE.Group>(null)
  const colors = useMemo(() => Object.fromEntries(scenes.map((s) => [s.id, new THREE.Color(config.acts[s.act].ui)])), [])

  useFrame(({ scene }) => {
    const f = getFrame()
    const look = config.acts[f.act]
    auto.current!.position.z = f.distance
    auto.current!.position.y = f.speed > 0.2 ? Math.abs(Math.sin(f.t * 18)) * 0.015 : 0
    led.current!.emissiveIntensity = 0.3 + f.activity * 3
    ground.current!.color.set(look.fog).multiplyScalar(0.35)
    blockMat.current!.color.copy(colors[f.scene.id])
    blockMat.current!.emissive.copy(colors[f.scene.id]).multiplyScalar(0.25)
    block.current!.position.set(6, 3, f.distance + 18)
    markerGroup.current!.position.z = Math.floor(f.distance / 6) * 6 - 60
    scene.background = new THREE.Color(look.sky[1]).multiplyScalar(0.6)
    ;(scene.fog as THREE.FogExp2).color.set(look.fog)
    ;(scene.fog as THREE.FogExp2).density = look.fogDensity
  })

  return (
    <>
      <fogExp2 attach="fog" args={['#000', 0.02]} />
      <hemisphereLight args={['#ffffff', '#222233', 0.8]} />
      <directionalLight position={[5, 10, 2]} intensity={1.5} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} scale={[400, 4000, 1]}>
        <planeGeometry />
        <meshStandardMaterial ref={ground} color="#222" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 900]} scale={[7, 2000, 1]}>
        <planeGeometry />
        <meshStandardMaterial color="#1b1b20" />
      </mesh>
      <group ref={markerGroup}>
        {markers.map((z) => (
          <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.01, z]}>
            <planeGeometry args={[0.15, 2]} />
            <meshBasicMaterial color="#d9d3c0" />
          </mesh>
        ))}
      </group>
      <mesh ref={block}>
        <boxGeometry args={[6, 6, 6]} />
        <meshStandardMaterial ref={blockMat} />
      </mesh>
      <group ref={auto}>
        <mesh position={[0, 0.7, 0.2]}>
          <boxGeometry args={[1.3, 1.0, 2.4]} />
          <meshStandardMaterial color={config.auto.paint.upper} transparent opacity={0.35} />
        </mesh>
        <mesh position={[0, 1.65, 0.1]}>
          <boxGeometry args={[1.4, 0.08, 2.6]} />
          <meshStandardMaterial color={config.auto.paint.canopy} />
        </mesh>
        <mesh position={[0, 1.58, 0.1]}>
          <boxGeometry args={[1.3, 0.03, 2.4]} />
          <meshStandardMaterial ref={led} color="#000" emissive={config.acts.dusk.accent} />
        </mesh>
      </group>
      <mesh position={MACRO_ORIGIN}>
        <boxGeometry args={[8, 1, 8]} />
        <meshStandardMaterial color="#0c3d34" emissive="#14f1d9" emissiveIntensity={0.2} />
      </mesh>
    </>
  )
}
