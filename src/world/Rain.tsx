// GPU rain: streaks wrapped around the camera, a pure function of t. Starts at 58, heavy at Silk Board,
// thins through the reroute, stops before pre-dawn.
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { getFrame } from '../engine/store'
import { Q } from './quality'

export const rainAmount = (t: number) =>
  t < 58 ? 0 : t < 60 ? (t - 58) / 2 * 0.4 : t < 90 ? 1 : t < 100 ? 1 - ((t - 90) / 10) * 0.9 : t < 102 ? 0.1 * (1 - (t - 100) / 2) : 0

const vert = /* glsl */ `
attribute vec4 seed; // x, z, phase, tail(0|1)
uniform float uTime; uniform vec3 uCam; uniform float uSize;
varying float vTail;
void main() {
  vec3 p;
  p.x = uCam.x + (fract(seed.x - uCam.x / uSize) - 0.5) * uSize;
  p.z = uCam.z + (fract(seed.y - uCam.z / uSize) - 0.5) * uSize;
  float fall = fract(seed.z - uTime * 0.9);
  p.y = uCam.y - 6.0 + fall * 18.0 + seed.w * 0.55;
  p.x += seed.w * 0.04;
  vTail = seed.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`
const frag = /* glsl */ `
uniform float uAmount; uniform vec3 uColor; varying float vTail;
void main() { gl_FragColor = vec4(uColor, uAmount * mix(0.55, 0.0, vTail)); }`

export function Rain() {
  const { geo, mat } = useMemo(() => {
    const n = Q.rain
    const seeds = new Float32Array(n * 2 * 4)
    for (let i = 0; i < n; i++) {
      const x = Math.random(), z = Math.random(), ph = Math.random()
      seeds.set([x, z, ph, 0, x, z, ph, 1], i * 8)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 4))
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3))
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uSize: { value: 36 }, uAmount: { value: 0 }, uColor: { value: new THREE.Color('#cfd8e6') } },
    })
    return { geo, mat }
  }, [])
  useFrame(({ camera }) => {
    const f = getFrame()
    mat.uniforms.uTime.value = f.t
    mat.uniforms.uCam.value.copy(camera.position)
    mat.uniforms.uAmount.value = rainAmount(f.t) * (f.shot.type === 'MACRO' ? 0 : 1)
  })
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />
}
