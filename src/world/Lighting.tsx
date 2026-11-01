// Lighting presets per act (config.acts), crossfaded at act changes. Sky dome, fog, sun, ambient, exposure.
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getFrame, useRide } from '../engine/store'
import { actBlend, autoPose } from './kit'
import { Q } from './quality'

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`
const frag = /* glsl */ `
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor; uniform float sunSize;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(horizon, zenith, pow(max(h, 0.0), 0.55));
  col = mix(col, horizon * 0.6, smoothstep(0.0, -0.2, h));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  col += sunColor * (pow(s, 900.0 / sunSize) * 3.0 + pow(s, 12.0) * 0.35);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

const tmpA = new THREE.Color(), tmpB = new THREE.Color()
const mix = (out: THREE.Color, a: string, b: string, p: number) => out.set(tmpA.set(a)).lerp(tmpB.set(b), p)
const lerp = (a: number, b: number, p: number) => a + (b - a) * p

export function Lighting() {
  const { scene, gl } = useThree()
  const sky = useRef<THREE.Mesh>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const uniforms = useMemo(() => ({
    zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, 0.1, 1) }, sunColor: { value: new THREE.Color() }, sunSize: { value: 1 },
  }), [])
  const fog = useMemo(() => new THREE.FogExp2('#000', 0.02), [])
  scene.fog = fog

  useFrame(({ camera }) => {
    const f = getFrame()
    const { from: a, to: b, p } = actBlend(f.t)
    mix(uniforms.zenith.value, a.sky[0], b.sky[0], p)
    mix(uniforms.horizon.value, a.sky[1], b.sky[1], p)
    mix(uniforms.sunColor.value, a.sun.color, b.sun.color, p)
    const el = THREE.MathUtils.degToRad(lerp(a.sun.elevation, b.sun.elevation, p))
    const az = THREE.MathUtils.degToRad(lerp(a.sun.azimuth, b.sun.azimuth, p))
    // azimuth 180 = straight ahead (+z)
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el))
    uniforms.sunDir.value.copy(dir)
    uniforms.sunSize.value = f.act === 'sunrise' || f.act === 'dusk' ? 2.5 : 0.6
    sky.current!.position.copy(camera.position)

    mix(fog.color, a.fog, b.fog, p)
    fog.density = lerp(a.fogDensity, b.fogDensity, p) * (f.scene.id === 'voice' && f.shot.type === 'MACRO' ? 0.2 : 1)

    const pose = autoPose(useRide.getState().ride, f.t)
    sun.current!.position.set(pose.x + dir.x * 60, dir.y * 60 + 5, pose.z + dir.z * 60)
    sun.current!.target.position.set(pose.x, 0, pose.z + 8)
    sun.current!.target.updateMatrixWorld()
    mix(sun.current!.color, a.sun.color, b.sun.color, p)
    sun.current!.intensity = lerp(a.sun.intensity, b.sun.intensity, p)
    mix(hemi.current!.color, a.ambient.color, b.ambient.color, p)
    mix(hemi.current!.groundColor, a.fog, b.fog, p).multiplyScalar(0.4)
    hemi.current!.intensity = lerp(a.ambient.intensity, b.ambient.intensity, p) * 1.6
    gl.toneMappingExposure = lerp(a.exposure, b.exposure, p)
  })

  return (
    <>
      <mesh ref={sky} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[900, 32, 16]} />
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} castShadow={Q.shadows} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}
        shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={150} />
    </>
  )
}
