// Instanced traffic. Flowing traffic is a pure function of t (z = base + v·t, wrapped around the auto);
// at Silk Board it becomes a parked grid of cars and buses, a sea of tail-lights. A delivery rider zips past.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { config } from '../content/config'
import { getFrame, useRide } from '../engine/store'
import { motionAt } from '../engine/timeline'
import { autoPose, rand } from './kit'
import { Q } from './quality'

type Kind = 'car' | 'bus' | 'auto' | 'bike'
const DIMS: Record<Kind, [number, number, number]> = { car: [1.8, 1.35, 4.2], bus: [2.5, 3.1, 11], auto: [1.3, 1.7, 2.6], bike: [0.6, 1.25, 1.8] }
const CAR_COLS = ['#d8d8d8', '#2b2b2b', '#8a1f1f', '#e6e1d4', '#3c4a5c', '#6f7378', '#1d3557']

const wrap = (x: number, a: number, b: number) => a + ((((x - a) % (b - a)) + (b - a)) % (b - a))

export function Traffic() {
  const N = Q.traffic + 20
  const body = useRef<THREE.InstancedMesh>(null)
  const cabin = useRef<THREE.InstancedMesh>(null)
  const tail = useRef<THREE.InstancedMesh>(null)
  const head = useRef<THREE.InstancedMesh>(null)
  const o = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])

  const flow = useMemo(() => Array.from({ length: 34 }, (_, i) => {
    const r = (k: number) => rand(900 + i, k)
    const oncoming = r(0) < 0.45
    const kind: Kind = r(1) < 0.12 ? 'bus' : r(1) < 0.35 ? 'auto' : r(1) < 0.55 ? 'bike' : 'car'
    return { kind, oncoming, x: oncoming ? -3.4 - r(2) * 1.4 : -1.2 - r(2) * 0.6, base: r(3) * 320, v: oncoming ? -(9 + r(4) * 6) : 6 + r(4) * 9, color: r(5) }
  }), [])

  useFrame(() => {
    const f = getFrame()
    const ride = useRide.getState().ride
    const pose = autoPose(ride, f.t)
    let i = 0
    const place = (kind: Kind, x: number, z: number, facing: 1 | -1, c: number, brake: number) => {
      if (i >= N) return
      const [w, h, l] = DIMS[kind]
      o.rotation.set(0, facing === 1 ? 0 : Math.PI, 0)
      o.position.set(x, h * 0.42, z)
      o.scale.set(w, h * 0.55, l)
      o.updateMatrix()
      body.current!.setMatrixAt(i, o.matrix)
      if (kind === 'auto') col.set(c < 0.5 ? config.auto.paint.upper : config.auto.paint.lower)
      else if (kind === 'bus') col.set(c < 0.5 ? '#2f6b9a' : '#b23a2a')
      else col.set(CAR_COLS[Math.floor(c * CAR_COLS.length)])
      body.current!.setColorAt(i, col)
      o.position.set(x, h * 0.8, z - facing * l * 0.05)
      o.scale.set(w * 0.86, h * (kind === 'bus' ? 0.4 : 0.38), l * (kind === 'bus' ? 0.96 : 0.55))
      o.updateMatrix()
      cabin.current!.setMatrixAt(i, o.matrix)
      o.position.set(x, h * 0.45, z - facing * (l / 2 + 0.02))
      o.scale.set(w * 0.9, 0.09 + brake * 0.05, 0.04)
      o.updateMatrix()
      tail.current!.setMatrixAt(i, o.matrix)
      o.position.set(x, h * 0.4, z + facing * (l / 2 + 0.02))
      o.scale.set(w * 0.8, 0.07, 0.04)
      o.updateMatrix()
      head.current!.setMatrixAt(i, o.matrix)
      i++
    }

    const jam = f.scene.id === 'jam' || (f.scene.id === 'build' && f.t > 55)
    if (jam) {
      // the junction: everything parked around where the auto stops
      const zJ = motionAt(ride.motion, 62).distance
      for (let lane = -4; lane <= 3; lane++) {
        for (let row = -6; row <= 12; row++) {
          const x = 1.2 + lane * 3.1 + (rand(lane, row) - 0.5) * 0.6
          const z = zJ + row * 6.2 + (rand(row, lane + 9) - 0.5) * 1.2
          if (lane === 0 && Math.abs(z - zJ) < 4) continue // the auto's own slot
          const r = rand(lane + 50, row + 50)
          const kind: Kind = r < 0.16 ? 'bus' : r < 0.36 ? 'auto' : r < 0.5 ? 'bike' : 'car'
          if (kind === 'bus' && row % 2) continue
          place(kind, x, z, 1, rand(row, lane), 1)
        }
      }
      // ten-minute delivery rider weaving past (68.5–72.5)
      if (f.t > 68.5 && f.t < 72.5) place('bike', -0.4, zJ - 22 + (f.t - 68.5) * 16, 1, 0.1, 0)
    }
    if (!jam || f.t < 60) {
      for (const v of flow) {
        const z = pose.z + wrap(v.base + v.v * f.t - pose.z, -60, 260)
        place(v.kind, v.x, z, v.oncoming ? -1 : 1, v.color, 0)
      }
      // the first auto that refuses the pickup (0–3 s)
      if (f.t < 4) place('auto', -0.4, motionAt(ride.motion, 6.8).distance - 10 + f.t * 9, 1, 0.2, 0)
    }
    for (const m of [body, cabin, tail, head]) { m.current!.count = i; m.current!.instanceMatrix.needsUpdate = true }
    if (body.current!.instanceColor) body.current!.instanceColor.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={body} args={[undefined, undefined, N]} castShadow frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.35} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={cabin} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#0d1218" roughness={0.1} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={tail} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial color={new THREE.Color('#ff1424').multiplyScalar(4)} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial color={new THREE.Color('#fff2d0').multiplyScalar(2.5)} toneMapped={false} />
      </instancedMesh>
    </>
  )
}
