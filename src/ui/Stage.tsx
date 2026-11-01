import { Canvas } from '@react-three/fiber'
import { CameraRig } from '../camera/CameraRig'
import { PlaceholderWorld } from '../scenes/Placeholder'

export function Stage() {
  return (
    <div className="stage">
      <Canvas dpr={[1, 1.75]} camera={{ fov: 60, near: 0.05, far: 2000, position: [0, 2, -5] }} gl={{ antialias: true, preserveDrawingBuffer: false }}>
        <CameraRig />
        <PlaceholderWorld />
      </Canvas>
    </div>
  )
}
