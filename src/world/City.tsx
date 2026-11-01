// Procedural roadside: instanced buildings with shader windows, trees, street lamps with light pools.
// Everything is placed by slot index along the road (deterministic), recycled around the auto.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getFrame, useRide } from '../engine/store'
import { actBlend, autoPose, rand, zoneAtZ } from './kit'
import { Q } from './quality'
import { ZONES } from './zones'

const SLOT = 9, BEHIND = 8, AHEAD = 30 // slots
const LAMP = 24

const windowUniforms = { uFold: { value: 0 }, uGlow: { value: 1 }, uWarm: { value: new THREE.Color('#ffc477') }, uCool: { value: new THREE.Color('#9fd4ff') } }

function windowMaterial() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.05 })
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, windowUniforms)
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNorm; uniform float uFold;')
      // page-fold: each building rotates flat about its road-side base edge, falling away from the road
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { float side = sign(instanceMatrix[3].x); float a = uFold * 1.5 * side;
          vec2 piv = vec2(-side * 0.5, -0.5); vec2 q = transformed.xy - piv;
          transformed.xy = piv + vec2(q.x * cos(a) + q.y * sin(a), -q.x * sin(a) + q.y * cos(a)); }`)
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvec4 wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0); vWPos = wp.xyz; vWNorm = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNorm; uniform float uGlow; uniform vec3 uWarm; uniform vec3 uCool;\nfloat h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (abs(vWNorm.y) < 0.5) {
          float u = abs(vWNorm.x) > 0.5 ? vWPos.z : vWPos.x;
          vec2 cell = vec2(u / 2.6, vWPos.y / 3.2);
          vec2 f = fract(cell);
          float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.82) * step(1.0, cell.y);
          float r = h21(floor(cell) + floor(vWPos.xz * 0.05));
          float lit = step(0.55, r);
          vec3 wc = mix(uWarm, uCool, step(0.85, r));
          totalEmissiveRadiance += win * lit * wc * uGlow * (0.6 + 0.4 * r);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.35, win);
          float shop = step(vWPos.y, 2.6) * step(0.4, vWPos.y) * step(0.5, h21(floor(vec2(u / 6.0, 3.0))));
          totalEmissiveRadiance += shop * uWarm * uGlow * 0.5;
        }`)
  }
  return m
}

const PALETTE = ['#b9a58a', '#c7b9a3', '#8f8a84', '#d0c5b4', '#a3866b', '#7f8e94', '#c9b28d', '#9c9a8f']
const RURAL = ['#d8b98a', '#c98f6a', '#e3d3b0', '#b88a5e']

export function City() {
  const n = (BEHIND + AHEAD) * 4
  const bld = useRef<THREE.InstancedMesh>(null)
  const trees = useRef<THREE.InstancedMesh>(null)
  const trunks = useRef<THREE.InstancedMesh>(null)
  const poles = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const pools = useRef<THREE.InstancedMesh>(null)
  const headMat = useRef<THREE.MeshBasicMaterial>(null)
  const poolMat = useRef<THREE.MeshBasicMaterial>(null)
  const mat = useMemo(windowMaterial, [])
  const o = useMemo(() => new THREE.Object3D(), [])
  const c = useMemo(() => new THREE.Color(), [])
  const lampCol = useMemo(() => new THREE.Color(), [])
  const lastSlot = useRef(NaN)
  const lampN = 40

  useFrame(() => {
    const f = getFrame()
    const ride = useRide.getState().ride
    const pose = autoPose(ride, f.t)
    const { from, to, p } = actBlend(f.t)
    // window glow per act: off in daylight
    const glowOf = (a: typeof from) => (a.label === 'Sunrise' ? 0.05 : a.label === 'Dusk' ? 0.8 : 1.6)
    windowUniforms.uGlow.value = glowOf(from) + (glowOf(to) - glowOf(from)) * p
    // page-fold into Mahalingpur (12 → 16): the city folds flat and falls away
    const fp = THREE.MathUtils.clamp((f.t - 12.3) / 3.2, 0, 1)
    windowUniforms.uFold.value = f.t >= 12 && f.t < 16 ? fp * fp * (3 - 2 * fp) : 0
    lampCol.set(from.street).lerp(new THREE.Color(to.street), p)
    const lampOn = to.label === 'Sunrise' ? 0.05 * p + (1 - p) : 1
    headMat.current!.color.copy(lampCol).multiplyScalar(2.5 * lampOn)
    poolMat.current!.color.copy(lampCol).multiplyScalar(0.35 * lampOn)

    const slot = Math.floor(pose.z / SLOT)
    const home = f.scene.id === 'mahalingpur' && f.t >= 16
    const key = slot * 2 + (home ? 1 : 0)
    if (key === lastSlot.current) return
    lastSlot.current = key

    let bi = 0, ti = 0
    for (let k = slot - BEHIND; k < slot + AHEAD; k++) {
      const z = k * SLOT
      const zid = zoneAtZ(ride, z).id
      const zone = home && zid !== 'mahalingpur' ? ZONES.mahalingpur : ZONES[zid] ?? ZONES.pickup
      for (const side of [1, -1]) {
        for (let row = 0; row < 2; row++) {
          const seed = k * 4 + (side > 0 ? 0 : 2) + row
          const r = (i: number) => rand(seed, i)
          if (r(0) > zone.buildings * (row ? 0.9 : 1)) {
            // gap: maybe a tree instead
            if (r(5) < zone.trees + 0.3 && ti < n) {
              o.position.set(side * (zone.setback - 1 + r(6) * 4 + row * 10), 0, z + r(7) * SLOT)
              const s = 0.8 + r(8) * 0.8
              o.scale.set(s, s, s)
              o.rotation.set(0, 0, 0)
              o.updateMatrix()
              trees.current!.setMatrixAt(ti, o.matrix)
              trunks.current!.setMatrixAt(ti, o.matrix)
              ti++
            }
            continue
          }
          const w = 6 + r(1) * 8
          const d = 7 + r(2) * 8
          const h = zone.height[0] + Math.pow(r(3), 1.6) * (zone.height[1] - zone.height[0]) * (row ? 1.4 : 1)
          o.position.set(side * (zone.setback + d / 2 + row * 14 + r(9) * 2), h / 2, z + SLOT / 2)
          o.scale.set(d, h, Math.min(w, SLOT - 0.4))
          o.rotation.set(0, 0, 0)
          o.updateMatrix()
          bld.current!.setMatrixAt(bi, o.matrix)
          const pal = zone.fields ? RURAL : PALETTE
          c.set(pal[Math.floor(r(4) * pal.length)]).multiplyScalar(0.75 + r(10) * 0.35)
          bld.current!.setColorAt(bi, c)
          bi++
          if (zone.trees > r(11) && row === 0 && ti < n) {
            o.position.set(side * (zone.setback - 1.6), 0, z + r(12) * SLOT)
            const s = 0.7 + r(13) * 0.6
            o.scale.set(s, s, s)
            o.updateMatrix()
            trees.current!.setMatrixAt(ti, o.matrix)
            trunks.current!.setMatrixAt(ti, o.matrix)
            ti++
          }
        }
      }
    }
    bld.current!.count = bi
    trees.current!.count = ti
    trunks.current!.count = ti
    bld.current!.instanceMatrix.needsUpdate = true
    if (bld.current!.instanceColor) bld.current!.instanceColor.needsUpdate = true
    trees.current!.instanceMatrix.needsUpdate = true
    trunks.current!.instanceMatrix.needsUpdate = true

    // lamps every LAMP metres, alternating sides
    let li = 0
    const l0 = Math.floor((pose.z - 60) / LAMP)
    for (let k = l0; k < l0 + lampN; k++) {
      const z = k * LAMP
      const zone = ZONES[zoneAtZ(ride, z).id] ?? ZONES.pickup
      if (!zone.lamps) continue
      const side = k % 2 ? 1 : -1
      const x = side * (zone.roadWidth / 2 + 0.6)
      o.position.set(x, 4, z)
      o.scale.set(1, 1, 1)
      o.updateMatrix()
      poles.current!.setMatrixAt(li, o.matrix)
      o.position.set(x - side * 1.1, 7.9, z)
      o.updateMatrix()
      heads.current!.setMatrixAt(li, o.matrix)
      o.position.set(x - side * 2.2, 0.03, z)
      o.rotation.set(-Math.PI / 2, 0, 0)
      o.updateMatrix()
      pools.current!.setMatrixAt(li, o.matrix)
      o.rotation.set(0, 0, 0)
      li++
    }
    for (const m of [poles, heads, pools]) { m.current!.count = li; m.current!.instanceMatrix.needsUpdate = true }
  })

  return (
    <>
      <instancedMesh ref={bld} args={[undefined, undefined, Math.min(n, Q.buildings * 2)]} material={mat} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry />
      </instancedMesh>
      <instancedMesh ref={trees} args={[undefined, undefined, n]} castShadow frustumCulled={false}>
        <icosahedronGeometry args={[1.8, 1]} onUpdate={(g) => g.translate(0, 4.2, 0)} />
        <meshStandardMaterial color="#2f4a2a" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, n]} frustumCulled={false}>
        <cylinderGeometry args={[0.15, 0.22, 3, 6]} onUpdate={(g) => g.translate(0, 1.5, 0)} />
        <meshStandardMaterial color="#3b2a1d" />
      </instancedMesh>
      <instancedMesh ref={poles} args={[undefined, undefined, lampN]} frustumCulled={false}>
        <cylinderGeometry args={[0.08, 0.1, 8, 6]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, lampN]} frustumCulled={false}>
        <boxGeometry args={[0.9, 0.12, 0.35]} />
        <meshBasicMaterial ref={headMat} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, undefined, lampN]} frustumCulled={false} renderOrder={1}>
        <circleGeometry args={[5, 24]} />
        <meshBasicMaterial ref={poolMat} transparent blending={THREE.AdditiveBlending} depthWrite={false} map={poolTexture()} />
      </instancedMesh>
    </>
  )
}

let pool: THREE.Texture | null = null
function poolTexture() {
  if (pool) return pool
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  pool = new THREE.CanvasTexture(c)
  return pool
}
