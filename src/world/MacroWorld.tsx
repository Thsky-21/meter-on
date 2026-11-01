// S7 chip city: a circuit board as a city. Module = a block of buildings, mic = a tower, the voice wave
// travels into the mic, through stacked neural layers that light in sequence, until the wake word lights an LED.
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MACRO_ORIGIN } from '../camera/CameraRig'
import { getFrame } from '../engine/store'
import { liveActivity } from '../engine/voiceActivity'
import { rand, textTexture } from './kit'

const LAYERS = 4, GRID = 5
const layerX = (k: number) => -2 + k * 3
const MIC: [number, number, number] = [-8, 0, 2]
const LED: [number, number, number] = [11, 0.4, -1]

function boardTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const g = c.getContext('2d')!
  g.fillStyle = '#062a22'
  g.fillRect(0, 0, 1024, 1024)
  g.strokeStyle = '#c9a54a'
  g.globalAlpha = 0.55
  for (let i = 0; i < 70; i++) {
    g.lineWidth = 2 + rand(1, i) * 4
    g.beginPath()
    let x = rand(2, i) * 1024, y = rand(3, i) * 1024
    g.moveTo(x, y)
    for (let k = 0; k < 4; k++) {
      if (k % 2) y += (rand(4, i * 9 + k) - 0.5) * 500
      else x += (rand(5, i * 9 + k) - 0.5) * 500
      g.lineTo(x, y)
    }
    g.stroke()
    g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fillStyle = '#c9a54a'; g.fill()
  }
  g.globalAlpha = 1
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function MacroWorld() {
  const board = useMemo(boardTexture, [])
  const label = useMemo(() => textTexture({ w: 1024, h: 160, fg: '#f2efe2', lines: [{ text: 'SIH 2026 · team project', size: 84, font: 'mono' }] }), [])
  const micLabel = useMemo(() => textTexture({ w: 256, h: 96, fg: '#f2efe2', lines: [{ text: 'MIC', size: 64, font: 'mono' }] }), [])
  const modLabel = useMemo(() => textTexture({ w: 512, h: 128, fg: '#2a2a2a', lines: [{ text: 'MCU · WAKE-WORD', size: 56, font: 'mono' }] }), [])
  const dots = useRef<THREE.InstancedMesh>(null)
  const dotMat = useRef<THREE.MeshStandardMaterial>(null)
  const led = useRef<THREE.MeshStandardMaterial>(null)
  const ledLight = useRef<THREE.PointLight>(null)
  const wave = useRef<THREE.Group>(null)
  const col = useMemo(() => new THREE.Color(), [])
  const o = useMemo(() => new THREE.Object3D(), [])
  const comps = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
    x: -16 + rand(7, i) * 32, z: -15 + rand(8, i) * 30, w: 0.4 + rand(9, i) * 1.4, d: 0.4 + rand(10, i) * 2, h: 0.2 + rand(11, i) * 1.2,
    c: rand(12, i) < 0.5 ? '#1b1b1b' : rand(12, i) < 0.8 ? '#6b4b2a' : '#b9b9b9',
  })).filter((c) => Math.abs(c.z) > 4.5 || c.x < -12), [])
  const wavePts = useMemo(() => Array.from({ length: 80 }, () => new THREE.Vector3()), [])
  const lineRef = useRef<{ geometry: { setPositions: (a: number[]) => void } }>(null)

  useFrame(() => {
    const f = getFrame()
    if (f.scene.id !== 'voice') return
    const act = liveActivity() ?? f.activity
    const lt = f.t - 105 // local time in the macro shot
    // wave travelling into the mic
    for (let i = 0; i < wavePts.length; i++) {
      const u = i / (wavePts.length - 1)
      const x = -22 + u * (MIC[0] + 22)
      const env = Math.sin(u * Math.PI) * (0.3 + act * 1.6)
      wavePts[i].set(x, 2.2 + Math.sin(u * 30 - f.t * 12) * env, MIC[2])
    }
    lineRef.current?.geometry.setPositions(wavePts.flatMap((p) => [p.x, p.y, p.z]))
    // layers light in sequence
    let i = 0
    for (let k = 0; k < LAYERS; k++) {
      const on = THREE.MathUtils.clamp((lt - 1.5 - k * 1.6) / 0.8, 0, 1)
      for (let a = 0; a < GRID; a++) for (let b = 0; b < GRID; b++) {
        o.position.set(layerX(k), 1 + a * 0.7, -1.4 + b * 0.7)
        const pulse = on * (0.6 + 0.4 * Math.sin(f.t * 8 + a + b + k))
        o.scale.setScalar(0.07 + pulse * 0.05)
        o.updateMatrix()
        dots.current!.setMatrixAt(i, o.matrix)
        col.set('#14f1d9').multiplyScalar(0.1 + pulse * 1.6 * (0.5 + act * 0.5))
        dots.current!.setColorAt(i++, col)
      }
    }
    dots.current!.instanceMatrix.needsUpdate = true
    if (dots.current!.instanceColor) dots.current!.instanceColor.needsUpdate = true
    const wake = THREE.MathUtils.clamp((lt - 8.2) / 0.3, 0, 1)
    led.current!.emissiveIntensity = 0.2 + wake * 12
    ledLight.current!.intensity = wake * 40
    wave.current!.visible = lt < 9.5
  })

  return (
    <group position={MACRO_ORIGIN}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial map={board} roughness={0.55} metalness={0.2} />
      </mesh>
      {comps.map((c, i) => (
        <mesh key={i} position={[c.x, c.h / 2, c.z]} castShadow>
          <boxGeometry args={[c.w, c.h, c.d]} />
          <meshStandardMaterial color={c.c} roughness={0.5} metalness={c.c === '#b9b9b9' ? 0.8 : 0.1} />
        </mesh>
      ))}
      {/* the module: a block of buildings under a metal can */}
      <mesh position={[3, 0.4, -7]} castShadow>
        <boxGeometry args={[9, 0.8, 5]} />
        <meshStandardMaterial color="#b8bcc2" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[3, 0.81, -7]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[6, 1.5]} />
        <meshBasicMaterial map={modLabel} transparent />
      </mesh>
      {/* the mic tower */}
      <group position={MIC}>
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.9, 1.1, 4, 24]} />
          <meshStandardMaterial color="#cfd3d8" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 4.05, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.1, 24]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0.02, 1.6]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.6, 0.6]} />
          <meshBasicMaterial map={micLabel} transparent />
        </mesh>
      </group>
      <group ref={wave}>
        <Line ref={lineRef as never} points={wavePts} color="#7ff6ff" lineWidth={3} toneMapped={false} />
      </group>
      <instancedMesh ref={dots} args={[undefined, undefined, LAYERS * GRID * GRID]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial ref={dotMat} color="#000" emissive="#ffffff" toneMapped={false} />
      </instancedMesh>
      {Array.from({ length: LAYERS }, (_, k) => (
        <mesh key={k} position={[layerX(k), 2.4, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[3.8, 3.8]} />
          <meshStandardMaterial color="#14f1d9" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={LED}>
        <sphereGeometry args={[0.45, 20, 16]} />
        <meshStandardMaterial ref={led} color="#fff" emissive="#fffbe8" toneMapped={false} />
      </mesh>
      <pointLight ref={ledLight} position={[LED[0], 1.5, LED[2]]} color="#fff6dd" distance={20} />
      <mesh position={[0, 0.02, 9]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[14, 2.2]} />
        <meshBasicMaterial map={label} transparent />
      </mesh>
      <pointLight position={[0, 10, 6]} color="#8f7aff" intensity={60} distance={60} />
      <pointLight position={[-10, 6, -8]} color="#14f1d9" intensity={40} distance={50} />
    </group>
  )
}
