// The rear-view mirror shows Sky's eyes, drawn on a canvas (stylized). Expression follows the story.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getFrame } from '../engine/store'
import { AUTO } from './kit'
import { SKY_LOOK } from './Sky'

type Mood = 'neutral' | 'quiet' | 'smile'
const moodAt = (sceneId: string): Mood => (sceneId === 'jam' ? 'quiet' : sceneId === 'arrival' || sceneId === 'fare' ? 'smile' : 'neutral')
const blinking = (t: number) => t % 3.7 < 0.13

function drawEyes(g: CanvasRenderingContext2D, w: number, h: number, mood: Mood, blink: boolean) {
  const grad = g.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#5b3b28')
  grad.addColorStop(1, SKY_LOOK.skin)
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  g.fillStyle = SKY_LOOK.hair
  g.fillRect(0, 0, w, h * 0.12)
  const lift = mood === 'smile' ? -0.05 : mood === 'quiet' ? 0.06 : 0
  for (const cx of [w * 0.3, w * 0.7]) {
    const cy = h * 0.58, rx = w * 0.12, ry = h * 0.2
    g.strokeStyle = SKY_LOOK.hair
    g.lineWidth = h * 0.07
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(cx - rx * 1.1, cy - ry * (1.5 + lift * 4))
    g.quadraticCurveTo(cx, cy - ry * (2 + lift * 3), cx + rx * 1.1, cy - ry * (1.45 - lift * 2))
    g.stroke()
    if (blink) {
      g.beginPath()
      g.moveTo(cx - rx, cy)
      g.quadraticCurveTo(cx, cy + ry * 0.4, cx + rx, cy)
      g.stroke()
      continue
    }
    const top = mood === 'quiet' ? 0.35 : mood === 'smile' ? 0.75 : 1
    const bottom = mood === 'smile' ? 0.25 : 1
    g.save()
    g.beginPath()
    g.moveTo(cx - rx, cy)
    g.quadraticCurveTo(cx, cy - ry * 2 * top, cx + rx, cy)
    g.quadraticCurveTo(cx, cy + ry * 1.6 * bottom, cx - rx, cy)
    g.closePath()
    g.fillStyle = '#f3ece2'
    g.fill()
    g.clip()
    g.fillStyle = '#2a1a10'
    g.beginPath(); g.arc(cx, cy, ry * 0.85, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#050302'
    g.beginPath(); g.arc(cx, cy, ry * 0.4, 0, Math.PI * 2); g.fill()
    g.fillStyle = 'rgba(255,255,255,.85)'
    g.beginPath(); g.arc(cx + ry * 0.3, cy - ry * 0.3, ry * 0.18, 0, Math.PI * 2); g.fill()
    g.restore()
  }
}

export function MirrorEyes() {
  const { tex, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 160
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return { tex, canvas }
  }, [])
  const state = useRef('')
  useFrame(() => {
    const f = getFrame()
    const mood = moodAt(f.scene.id)
    const blink = blinking(f.t)
    const key = `${mood}${blink}`
    if (key === state.current) return
    state.current = key
    drawEyes(canvas.getContext('2d')!, canvas.width, canvas.height, mood, blink)
    tex.needsUpdate = true
  })
  return (
    <group position={[...AUTO.mirror]} rotation-x={0.12}>
      <mesh>
        <boxGeometry args={[0.3, 0.1, 0.03]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.016]} rotation-y={Math.PI}>
        <planeGeometry args={[0.28, 0.085]} />
        <meshBasicMaterial map={tex} toneMapped={false} color="#d8d0c8" />
      </mesh>
    </group>
  )
}
