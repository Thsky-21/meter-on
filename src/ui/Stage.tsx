import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { CameraRig } from '../camera/CameraRig'
import { Effects } from '../world/Effects'
import { Q } from '../world/quality'
import { World } from '../world/World'

export function Stage() {
  // adaptive resolution: drop toward 1x when frames fall behind, climb back when there's headroom
  const [dpr, setDpr] = useState(Q.dpr[1])
  return (
    <div className="stage">
      <Canvas shadows={Q.shadows} dpr={dpr} camera={{ fov: 60, near: 0.03, far: 2000, position: [0, 2, -5] }}
        gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}>
        <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onIncline={() => setDpr((d) => Math.min(Q.dpr[1], d + 0.25))} />
        <CameraRig />
        <World />
        <Effects />
      </Canvas>
    </div>
  )
}
