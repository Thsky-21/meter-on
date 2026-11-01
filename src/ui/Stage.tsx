import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { CameraRig, reducedMotion } from '../camera/CameraRig'
import { useRide } from '../engine/store'
import { Effects } from '../world/Effects'
import { Q } from '../world/quality'
import { World } from '../world/World'

/** Storyboard mode: render only when the shot changes (plus a couple of settle frames for loading props). */
function StoryboardInvalidator() {
  const invalidate = useThree((s) => s.invalidate)
  const shot = useRide((s) => s.frame.shotIndex)
  const fareOrLine = useRide((s) => `${s.frame.windshield?.line.id}|${s.frame.meter.words}`)
  useEffect(() => {
    invalidate()
    const ids = [200, 600, 1200].map((ms) => setTimeout(invalidate, ms))
    return () => ids.forEach(clearTimeout)
  }, [shot, fareOrLine, invalidate])
  return null
}

export function Stage() {
  // adaptive resolution: drop toward 1x when frames fall behind, climb back when there's headroom
  const [dpr, setDpr] = useState(Q.dpr[1])
  return (
    <div className="stage">
      <Canvas shadows={Q.shadows} dpr={dpr} frameloop={reducedMotion ? 'demand' : 'always'} camera={{ fov: 60, near: 0.03, far: 2000, position: [0, 2, -5] }}
        gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping, preserveDrawingBuffer: reducedMotion }}>
        {reducedMotion ? <StoryboardInvalidator /> : (
          <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onIncline={() => setDpr((d) => Math.min(Q.dpr[1], d + 0.25))} />
        )}
        <CameraRig />
        <World />
        <Effects />
      </Canvas>
    </div>
  )
}
