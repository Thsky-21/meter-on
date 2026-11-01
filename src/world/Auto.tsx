// Procedural Bengaluru auto-rickshaw. If assets.models.auto is set, the GLB replaces the body shell;
// the "live" parts (LED strip, headlight, meter, phone, mirror, flags) stay procedural and voice-driven.
import { Gltf, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { assets } from '../content/assets'
import { config } from '../content/config'
import { getFrame, useRide } from '../engine/store'
import { liveActivity } from '../engine/voiceActivity'
import { AUTO, actBlend, autoPose, textTexture } from './kit'
import { Meter } from './Meter'
import { DashboardPhone } from './DashboardPhone'
import { Sky } from './Sky'
import { Flags } from './props/Flags'
import { RateCard } from './props/RateCard'
import { MirrorEyes } from './MirrorEyes'
import { WindshieldCaption } from './WindshieldCaption'
import { QRSticker } from './props/QRSticker'

const P = config.auto.paint

export function Auto({ phone = true }: { phone?: boolean }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const ledMat = useRef<THREE.MeshStandardMaterial>(null)
  const headMat = useRef<THREE.MeshStandardMaterial>(null)
  const head = useRef<THREE.SpotLight>(null)
  const cabin = useRef<THREE.PointLight>(null)
  const key = useRef<THREE.PointLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const wheels = useRef<THREE.Group[]>([])
  const ledColor = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    const f = getFrame()
    const ride = useRide.getState().ride
    const pose = autoPose(ride, f.t)
    root.current!.position.set(pose.x, 0, pose.z)
    root.current!.rotation.y = pose.yaw
    const act = liveActivity() ?? f.activity
    // engine judder + jolt when braking into the pickup
    const judder = f.t < 139 ? (pose.speed > 0.2 ? 0.006 : 0.003) * (0.4 + act) : 0
    const jolt = f.t > 6.8 && f.t < 7.4 ? Math.sin((f.t - 6.8) * 18) * Math.exp(-(f.t - 6.8) * 6) * 0.03 : 0
    body.current!.position.y = Math.sin(f.t * 47) * judder + Math.abs(jolt)
    body.current!.rotation.x = jolt * 0.6 - Math.min(pose.speed, 12) * 0.0015
    for (const w of wheels.current) if (w) w.rotation.x = f.distance / 0.22
    const { from, to, p } = actBlend(f.t)
    ledColor.set(from.accent).lerp(new THREE.Color(to.accent), p)
    ledMat.current!.emissive.copy(ledColor)
    ledMat.current!.emissiveIntensity = 0.4 + act * 4
    headMat.current!.emissiveIntensity = 1.5 + act * 4
    cabin.current!.color.copy(ledColor)
    cabin.current!.intensity = 0.6 + act * 2.2
    // phone glow on Sky's face, stronger in exterior hero shots
    key.current!.intensity = f.shot.type === 'EXT_FRONT' ? 2.5 : 0.8
    head.current!.intensity = (f.act === 'sunrise' ? 4 : 18) + act * 30
  })

  const plate = useMemo(() => textTexture({ w: 512, h: 128, bg: '#f4f1e8', fg: '#111', lines: [{ text: config.auto.plate, size: 72, font: 'mono' }], border: '#111' }), [])
  const back = useMemo(() => textTexture({ w: 1024, h: 256, fg: '#111', lines: [{ text: config.auto.backText, size: 120, weight: 800 }] }), [])

  return (
    <group ref={root}>
      <group ref={body}>
        {assets.models.auto ? (
          <Suspense fallback={null}><Gltf src={assets.models.auto} /></Suspense>
        ) : (
          <Shell />
        )}
        {/* wheels: one front, two rear */}
        {([[0, 0.22, 1.05], [0.62, 0.22, -0.75], [-0.62, 0.22, -0.75]] as const).map((p, i) => (
          <group key={i} position={p} ref={(g) => { if (g) wheels.current[i] = g }}>
            <mesh rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.14, 20]} />
              <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
            </mesh>
            <mesh rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.12, 0.12, 0.15, 12]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.35} />
            </mesh>
          </group>
        ))}
        {/* LED strip under the canopy edge */}
        <mesh position={[0, 1.6, -0.1]}>
          <boxGeometry args={[1.32, 0.025, 2.1]} />
          <meshStandardMaterial ref={ledMat} color="#111" emissive={config.acts.dusk.accent} toneMapped={false} />
        </mesh>
        <pointLight ref={cabin} position={[0, 1.5, -0.1]} distance={2.6} decay={1.5} />
        <pointLight ref={key} position={[-0.2, 1.25, 0.95]} distance={1.8} decay={1.4} color="#cfe8ff" />
        {/* headlight */}
        <mesh position={AUTO.headlight as unknown as THREE.Vector3Tuple} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
          <meshStandardMaterial ref={headMat} color="#fff" emissive="#fff6d8" toneMapped={false} />
        </mesh>
        <spotLight ref={head} position={[0, 0.95, 1.4]} angle={0.5} penumbra={0.6} distance={40} decay={1.4} color="#fff3d6" target={target} />
        <primitive object={target} position={[0, 0, 14]} />
        {/* tail lights */}
        {[0.5, -0.5].map((x) => (
          <mesh key={x} position={[x, 0.55, -1.17]}>
            <boxGeometry args={[0.14, 0.08, 0.02]} />
            <meshStandardMaterial color="#300" emissive="#ff1a1a" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
        {/* back: SPEAK OK PLEASE + plate */}
        <mesh position={[0, 0.98, -1.165]} rotation-y={Math.PI}>
          <planeGeometry args={[1.1, 0.27]} />
          <meshStandardMaterial map={back} transparent />
        </mesh>
        <mesh position={[0, 0.5, -1.17]} rotation-y={Math.PI}>
          <planeGeometry args={[0.5, 0.125]} />
          <meshStandardMaterial map={plate} />
        </mesh>
        <mesh position={[0, 0.42, 1.36]}>
          <planeGeometry args={[0.36, 0.09]} />
          <meshStandardMaterial map={plate} />
        </mesh>
        <QRSticker />
        <Flags />
        <RateCard />
        <Meter />
        {phone && <DashboardPhone />}
        <MirrorEyes />
        <WindshieldCaption />
        <Sky />
      </group>
    </group>
  )
}

/** The body shell: green lower body, yellow upper/nose, black canopy. Chunky and clean. */
function Shell() {
  const green = <meshStandardMaterial color={P.lower} roughness={0.35} metalness={0.1} />
  const yellow = <meshStandardMaterial color={P.upper} roughness={0.35} metalness={0.1} />
  const canopy = <meshStandardMaterial color={P.canopy} roughness={0.8} side={THREE.DoubleSide} />
  const trim = <meshStandardMaterial color={P.trim} metalness={0.9} roughness={0.25} />
  return (
    <group>
      {/* floor pan + lower body */}
      <RoundedBox args={[1.32, 0.42, 2.3]} radius={0.08} position={[0, 0.5, -0.05]} castShadow>{green}</RoundedBox>
      {/* rear side panels (passenger area) */}
      {[0.64, -0.64].map((x) => (
        <RoundedBox key={x} args={[0.06, 0.38, 1.0]} radius={0.02} position={[x, 0.88, -0.62]}>{yellow}</RoundedBox>
      ))}
      {/* back panel */}
      <RoundedBox args={[1.3, 0.75, 0.08]} radius={0.03} position={[0, 0.98, -1.12]}>{yellow}</RoundedBox>
      {/* nose: the tapered front cowl */}
      <mesh position={[0, 0.72, 1.1]} castShadow>
        <cylinderGeometry args={[0.26, 0.36, 0.62, 20, 1, false, -Math.PI / 2, Math.PI]} />
        {yellow}
      </mesh>
      <RoundedBox args={[0.9, 0.3, 0.4]} radius={0.08} position={[0, 0.88, 0.9]}>{yellow}</RoundedBox>
      {/* dashboard */}
      <RoundedBox args={[1.02, 0.12, 0.22]} radius={0.04} position={[0, 1.02, 0.88]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </RoundedBox>
      {/* windshield + frame */}
      <mesh position={[0, 1.3, 0.98]} rotation-x={-0.08}>
        <planeGeometry args={[1.0, 0.5]} />
        <meshPhysicalMaterial color="#cfe6ff" transparent opacity={0.08} roughness={0.05} transmission={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {[0.51, -0.51].map((x) => (
        <mesh key={x} position={[x, 1.38, 0.95]} rotation-x={-0.08}>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          {trim}
        </mesh>
      ))}
      {/* canopy: curved roof + rear drop */}
      <mesh position={[0, 1.58, -0.12]} rotation-x={Math.PI / 2} scale={[1, 1, 0.22]}>
        <cylinderGeometry args={[0.7, 0.7, 2.25, 28, 1, true, -Math.PI / 2, Math.PI]} />
        {canopy}
      </mesh>
      <mesh position={[0, 1.58, -0.12]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.38, 2.25]} />
        {canopy}
      </mesh>
      <mesh position={[0, 1.28, -1.16]}>
        <boxGeometry args={[1.36, 0.6, 0.03]} />
        {canopy}
      </mesh>
      {/* roof poles */}
      {([[0.62, 0.15], [-0.62, 0.15], [0.62, -1.08], [-0.62, -1.08]] as const).map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 1.2, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
          {trim}
        </mesh>
      ))}
      {/* handlebar */}
      <mesh position={AUTO.handlebar as unknown as THREE.Vector3Tuple} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.018, 0.018, 0.74, 10]} />
        {trim}
      </mesh>
      {[0.36, -0.36].map((x) => (
        <mesh key={x} position={[x, 1.0, 0.78]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 10]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* driver seat + passenger bench */}
      <RoundedBox args={[0.5, 0.12, 0.42]} radius={0.04} position={[0, 0.78, 0.3]}><meshStandardMaterial color="#2a1d14" roughness={0.6} /></RoundedBox>
      <RoundedBox args={[1.16, 0.14, 0.5]} radius={0.05} position={[0, 0.66, -0.7]}><meshStandardMaterial color="#5a1e1e" roughness={0.6} /></RoundedBox>
      <RoundedBox args={[1.16, 0.5, 0.1]} radius={0.04} position={[0, 0.95, -1.0]}><meshStandardMaterial color="#5a1e1e" roughness={0.6} /></RoundedBox>
      {/* partition bar behind the driver (rate card hangs here) */}
      <mesh position={[0, 1.08, 0.08]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.018, 0.018, 1.2, 8]} />
        {trim}
      </mesh>
    </group>
  )
}
