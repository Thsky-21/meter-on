// In-world seven-segment meter. Reads the same hook as the HUD meter, so they never disagree.
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { SEGMENTS, SEGMENT_POLYGONS } from '../ui/SevenSeg'
import { useMeter } from '../ui/MeterHUD'
import { AUTO } from './kit'

export function Meter() {
  const m = useMeter()
  const { tex, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return { tex, canvas }
  }, [])
  const banner = m.banners.find((b) => b !== 'FOR HIRE') ?? ''

  useEffect(() => {
    const g = canvas.getContext('2d')!
    g.fillStyle = '#0b0505'
    g.fillRect(0, 0, 512, 256)
    const chars = m.reading.value.padStart(4, ' ').slice(-4).split('')
    const scale = 4.6, x0 = 40, y0 = 18
    chars.forEach((ch, i) => {
      for (const [s, pts] of Object.entries(SEGMENT_POLYGONS)) {
        const on = (SEGMENTS[ch] ?? '').includes(s)
        g.fillStyle = on ? '#ff2a2a' : 'rgba(255,42,42,0.1)'
        g.shadowColor = on ? '#ff2a2a' : 'transparent'
        g.shadowBlur = on ? 18 : 0
        g.beginPath()
        pts.split(' ').forEach((p, k) => {
          const [x, y] = p.split(',').map(Number)
          const X = x0 + i * 112 + x * scale, Y = y0 + y * scale
          if (k) g.lineTo(X, Y)
          else g.moveTo(X, Y)
        })
        g.closePath()
        g.fill()
      }
    })
    g.shadowBlur = 8
    g.shadowColor = '#ff2a2a'
    g.fillStyle = '#ff2a2a'
    g.font = "700 26px 'JetBrains Mono', monospace"
    g.textAlign = 'right'
    g.fillText(m.reading.label, 488, 200)
    if (banner) {
      g.textAlign = 'left'
      g.fillText(banner === 'WAITING' && m.waiting !== null ? `WAITING ${m.waiting}s` : banner, 24, 240)
    }
    tex.needsUpdate = true
  }, [m.reading.value, m.reading.label, banner, m.waiting, canvas, tex])

  return (
    <group position={[...AUTO.meter]} rotation-y={Math.PI - 0.25} rotation-x={-0.25}>
      <mesh>
        <boxGeometry args={[0.2, 0.11, 0.05]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[0.18, 0.09]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}
