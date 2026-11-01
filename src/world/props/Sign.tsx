// One flexible sign: billboards, signboards, gantry panels, painted walls, chalkboards, hoardings.
// Text is drawn on a canvas (Kannada renders with Noto Sans Kannada once fonts load).
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { textTexture, type TextTexOpts } from '../kit'

export interface SignProps {
  position: [number, number, number]
  rotationY?: number
  size: [number, number] // metres
  lines: TextTexOpts['lines']
  bg?: string
  fg?: string
  glow?: string
  border?: string
  align?: CanvasTextAlign
  /** lit signs glow (LED billboards, screens) */
  lit?: number
  posts?: boolean
  frame?: string
  onClick?: () => void
}

export function Sign({ position, rotationY = 0, size: [w, h], lines, bg, fg, glow, border, align, lit = 0, posts, frame, onClick }: SignProps) {
  const px = 1024
  const tex = useMemo(
    () => textTexture({ w: px, h: Math.round((px * h) / w), bg, fg, glow, border, align, lines: lines.map((l) => ({ ...l, size: l.size * (px / 1024) })) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(lines), bg, fg, w, h],
  )
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh onClick={onClick} castShadow receiveShadow>
        <planeGeometry args={[w, h]} />
        {lit ? (
          <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(lit)} transparent={!bg} />
        ) : (
          <meshStandardMaterial map={tex} roughness={0.8} transparent={!bg} />
        )}
      </mesh>
      {frame && (
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[w + 0.25, h + 0.25, 0.1]} />
          <meshStandardMaterial color={frame} roughness={0.6} metalness={0.4} />
        </mesh>
      )}
      {posts && [-w * 0.35, w * 0.35].map((x) => (
        <mesh key={x} position={[x, -(position[1]) / 2 - h / 4, -0.1]}>
          <boxGeometry args={[0.18, position[1] - h / 2 + 0.1, 0.18]} />
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}
