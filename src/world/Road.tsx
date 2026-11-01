// The road follows the auto: one long strip whose markings scroll with distance. Wet in the rain.
import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getFrame, useRide } from '../engine/store'
import { autoPose, zoneAtZ } from './kit'
import { Q } from './quality'
import { ZONES } from './zones'

const LEN = 420, BEHIND = 70, TILE = 12

function roadTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#2b2b2e'
  g.fillRect(0, 0, 256, 512)
  for (let i = 0; i < 4000; i++) {
    const v = 30 + Math.random() * 30
    g.fillStyle = `rgba(${v},${v},${v + 2},0.5)`
    g.fillRect(Math.random() * 256, Math.random() * 512, 1.5, 1.5)
  }
  g.fillStyle = '#e8e2cf'
  g.fillRect(124, 0, 8, 260) // dashed centre line
  g.fillRect(8, 0, 5, 512) // edges
  g.fillRect(243, 0, 5, 512)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1, LEN / TILE)
  t.anisotropy = 8
  return t
}

const wetness = (sceneId: string, t: number) =>
  sceneId === 'jam' ? 1 : sceneId === 'build' && t > 58 ? (t - 58) / 2 : sceneId === 'reroute' ? Math.max(0.3, 1 - (t - 90) / 12) : sceneId === 'voice' ? 0.25 : 0.05

export function Road() {
  const road = useRef<THREE.Mesh>(null)
  const ground = useRef<THREE.Mesh>(null)
  const groundMat = useRef<THREE.MeshStandardMaterial>(null)
  const paths = useRef<THREE.Group>(null)
  const map = useMemo(roadTexture, [])
  const width = useRef(11)
  const groundCol = useMemo(() => new THREE.Color(), [])
  const wet = useRef(0)

  useFrame((_, dt) => {
    const f = getFrame()
    const ride = useRide.getState().ride
    const pose = autoPose(ride, f.t)
    const zone = ZONES[zoneAtZ(ride, pose.z).id] ?? ZONES.pickup
    width.current += (zone.roadWidth - width.current) * Math.min(1, dt * 1.5)
    road.current!.position.set(0, 0, pose.z - BEHIND + LEN / 2)
    road.current!.scale.x = width.current
    map.offset.y = -(pose.z - BEHIND) / TILE
    ground.current!.position.set(pose.x, -0.02, pose.z + 100)
    groundCol.set(zone.ground)
    groundMat.current!.color.lerp(groundCol, Math.min(1, dt * 1.2))
    paths.current!.position.z = pose.z - BEHIND + LEN / 2
    paths.current!.children.forEach((c, i) => {
      c.position.x = (i ? -1 : 1) * (width.current / 2 + 1.2)
      c.visible = zone.footpath
    })
    wet.current += (wetness(f.scene.id, f.t) - wet.current) * Math.min(1, dt * 2)
    const m = road.current!.material as THREE.MeshStandardMaterial & { mixStrength?: number }
    m.roughness = 0.85 - wet.current * 0.7
    if ('mixStrength' in m) m.mixStrength = 0.2 + wet.current * 5
  })

  return (
    <>
      <mesh ref={road} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1, LEN]} />
        {Q.reflect ? (
          <MeshReflectorMaterial map={map} resolution={512} blur={[300, 80]} mixBlur={1} mixStrength={1} mirror={0.5}
            depthScale={0.4} minDepthThreshold={0.6} maxDepthThreshold={1.2} roughness={0.8} metalness={0.1} />
        ) : (
          <meshStandardMaterial map={map} roughness={0.8} metalness={0.1} />
        )}
      </mesh>
      <group ref={paths}>
        {[0, 1].map((i) => (
          <mesh key={i} position={[0, 0.08, 0]} receiveShadow>
            <boxGeometry args={[2.4, 0.16, LEN]} />
            <meshStandardMaterial color="#6d6862" roughness={0.9} />
          </mesh>
        ))}
      </group>
      <mesh ref={ground} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial ref={groundMat} color="#2a2724" roughness={1} />
      </mesh>
    </>
  )
}
