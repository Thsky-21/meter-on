// Shared world helpers: seeded randomness, canvas text textures, the auto's path, scene zones.
import * as THREE from 'three'
import { config } from '../content/config'
import { motionAt, scenes, type Ride } from '../engine/timeline'

// ───────── seeded random ─────────
export function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}
export const rand = (seed: number, i: number) => hash(seed * 7919 + i * 104729)

// ───────── auto local frame ─────────
// x = driver's LEFT (kerb side, India keeps left), y up, z forward. Origin: ground, centre of the auto.
export const AUTO = {
  eye: [0, 1.2, -0.55] as const,
  seatZ: 0.35,
  handlebar: [0, 1.0, 0.78] as const,
  meter: [0.34, 1.12, 0.86] as const,
  phone: [-0.24, 1.1, 0.86] as const,
  mirror: [0, 1.5, 0.98] as const,
  headlight: [0, 0.95, 1.32] as const,
}

/** The auto's lateral offset (m) over ride time: pickup pull-in, Silk Board side-lane squeeze. */
const LANE_KEYS: [number, number][] = [[0, 1.2], [4.2, 1.2], [6.8, 2.6], [11.2, 2.6], [13.5, 1.2], [85.6, 1.2], [88.5, 3.2], [92, 3.2], [96, 1.2]]
export function laneX(t: number) {
  for (let i = 0; i < LANE_KEYS.length - 1; i++) {
    const [t0, x0] = LANE_KEYS[i], [t1, x1] = LANE_KEYS[i + 1]
    if (t >= t0 && t < t1) { const p = (t - t0) / (t1 - t0); return x0 + (x1 - x0) * (p * p * (3 - 2 * p)) }
  }
  return LANE_KEYS[LANE_KEYS.length - 1][1]
}

/** Auto world transform at time t (pure): z = distance travelled, x = lane, yaw from lane change. */
export function autoPose(ride: Ride, t: number) {
  const m = motionAt(ride.motion, t)
  const x = laneX(t)
  const dx = (laneX(t + 0.1) - laneX(t - 0.1)) / 0.2
  const yaw = m.speed > 0.3 ? Math.atan2(dx, m.speed) : dx * 0.15
  return { x, z: m.distance, yaw, speed: m.speed }
}

/** Distance along the road at which each scene starts/ends (depends on how much was spoken). */
export function sceneSpans(ride: Ride) {
  return scenes.map((s) => ({ id: s.id, act: s.act, z0: motionAt(ride.motion, s.start).distance, z1: motionAt(ride.motion, s.end).distance }))
}
export function zoneAtZ(ride: Ride, z: number) {
  const spans = sceneSpans(ride)
  for (let i = spans.length - 1; i >= 0; i--) if (z >= spans[i].z0) return spans[i]
  return spans[0]
}

// ───────── act blending ─────────
/** Act look at t, crossfading over the first `fade` seconds of each scene. */
export function actBlend(t: number, fade = 2.5) {
  const i = Math.max(0, scenes.findIndex((s) => t >= s.start && t < s.end))
  const cur = scenes[i] ?? scenes[scenes.length - 1]
  const prev = scenes[i - 1]
  const p = prev && prev.act !== cur.act ? Math.min(1, (t - cur.start) / fade) : 1
  return { from: config.acts[prev?.act ?? cur.act], to: config.acts[cur.act], p: p * p * (3 - 2 * p) }
}

// ───────── canvas text textures ─────────
export interface TextTexOpts {
  w: number
  h: number
  bg?: string
  fg?: string
  lines: { text: string; size: number; font?: 'sans' | 'kn' | 'mono'; weight?: number; color?: string }[]
  align?: CanvasTextAlign
  pad?: number
  glow?: string
  border?: string
}
const FONTS = { sans: "'Inter', sans-serif", kn: "'Noto Sans Kannada', 'Inter', sans-serif", mono: "'JetBrains Mono', monospace" }

export function textTexture(o: TextTexOpts) {
  const c = document.createElement('canvas')
  c.width = o.w
  c.height = o.h
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const draw = () => {
    const g = c.getContext('2d')!
    g.clearRect(0, 0, o.w, o.h)
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, o.w, o.h) }
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = o.h * 0.04; g.strokeRect(0, 0, o.w, o.h) }
    const pad = o.pad ?? o.w * 0.06
    const total = o.lines.reduce((s, l) => s + l.size * 1.25, 0)
    let y = (o.h - total) / 2
    g.textAlign = o.align ?? 'center'
    g.textBaseline = 'top'
    const x = g.textAlign === 'center' ? o.w / 2 : g.textAlign === 'right' ? o.w - pad : pad
    for (const l of o.lines) {
      g.font = `${l.weight ?? 700} ${l.size}px ${FONTS[l.font ?? 'sans']}`
      g.fillStyle = l.color ?? o.fg ?? '#fff'
      if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = l.size * 0.5 } else g.shadowBlur = 0
      g.fillText(l.text, x, y + l.size * 0.1, o.w - pad * 2)
      y += l.size * 1.25
    }
    tex.needsUpdate = true
  }
  draw()
  // redraw once webfonts are ready (Kannada glyphs especially)
  if (typeof document !== 'undefined' && document.fonts) void document.fonts.ready.then(draw)
  return tex
}

export const color = (c: string) => new THREE.Color(c)
