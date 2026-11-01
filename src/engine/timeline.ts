// t → everything. computeFrame is pure: same (ride, t, inputs) → same frame.
import scriptJson from '../content/script.json'
import { config, type ActId } from '../content/config'
import { shots, type Shot } from '../camera/shots'
import { compileLines } from './words'
import { activityFromWords, lastWordAt, silenceAt } from './voiceActivity'
import type { Choices, CompiledLine, Hold, Hotspot, Lang, Scene, Script, TimedWord } from './types'

export const script = scriptJson as unknown as Script
export const scenes: Scene[] = [...script.scenes].sort((a, b) => a.order - b.order)
export const DURATION = config.duration

export function sceneAt(t: number): Scene {
  for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return scenes[i]
  return scenes[0]
}
export const sceneById = (id: string) => scenes.find((s) => s.id === id)

export function shotAt(t: number): { shot: Shot; index: number; p: number } {
  let index = shots.findIndex((s) => t >= s.start && t < s.end)
  if (index < 0) index = t < shots[0].start ? 0 : shots.length - 1
  const shot = shots[index]
  const p = clamp01((t - shot.start) / (shot.end - shot.start))
  return { shot, index, p }
}

// ───────────────────────── compiled ride ─────────────────────────

export interface Ride {
  key: string
  lines: CompiledLine[]
  /** Sky's lines shown on the phone (no caption-only lines) */
  phoneLines: CompiledLine[]
  voiced: TimedWord[]
  counted: TimedWord[]
  fillersAfterFlag: TimedWord[]
  langPrefix: number[] // bitmask of langs over `voiced` up to index
  motion: MotionTable
}

const LANG_BIT: Record<Lang, number> = { en: 1, kn: 2, hi: 4 }

let cache: Ride | null = null
export function compileRide(address: string, choices: Choices): Ride {
  const key = `${address}|${JSON.stringify(choices)}`
  if (cache?.key === key) return cache
  const lines = compileLines(script, address, choices)
  const all = lines.flatMap((l) => (l.captionOnly || l.speaker !== 'sky' ? [] : l.words)).sort((a, b) => a.t - b.t)
  const voiced = all
  const counted = all.filter((w) => w.counts)
  const fillersAfterFlag = all.filter((w) => w.filler && w.t >= config.flagDownAt)
  const langPrefix: number[] = []
  let mask = 0
  for (const w of voiced) { if (w.t >= config.flagDownAt) mask |= LANG_BIT[w.lang] ?? 0; langPrefix.push(mask) }
  const ride: Ride = {
    key, lines, voiced, counted, fillersAfterFlag, langPrefix,
    phoneLines: lines.filter((l) => !l.captionOnly && l.speaker === 'sky'),
    motion: buildMotion(voiced),
  }
  cache = ride
  return ride
}

// ───────────────────────── motion: nothing moves until you speak ─────────────────────────

export interface MotionTable { hz: number; activity: Float32Array; speed: Float32Array; distance: Float32Array }

function buildMotion(voiced: TimedWord[]): MotionTable {
  const hz = 30
  const n = Math.ceil(DURATION * hz) + 2
  const activity = new Float32Array(n), speed = new Float32Array(n), distance = new Float32Array(n)
  let smooth = 0, v = 0, d = 0
  const dt = 1 / hz
  const kA = 1 - Math.exp(-dt / config.activitySmoothing)
  const kV = 1 - Math.exp(-dt / 0.35)
  for (let i = 0; i < n; i++) {
    const t = i * dt
    const scene = sceneAt(t)
    smooth += (activityFromWords(voiced, t) - smooth) * kA
    activity[i] = smooth
    const floor = config.speedFloor[scene.id] ?? 0.3
    const target = isParked(t) ? 0 : config.baseSpeed[scene.act] * (floor + (1 - floor) * smooth)
    v += (target - v) * (target === 0 ? kV * 2.2 : kV) // braking is quicker than accelerating
    if (target === 0 && v < 0.05) v = 0
    speed[i] = v
    distance[i] = d
    d += v * dt
  }
  return { hz, activity, speed, distance }
}

export const isParked = (t: number) => config.parked.some(([a, b]) => t >= a && t < b)

export function motionAt(m: MotionTable, t: number) {
  const x = Math.max(0, t) * m.hz
  const i = Math.min(Math.floor(x), m.activity.length - 2)
  const f = x - i
  const lerp = (arr: Float32Array) => arr[i] + (arr[i + 1] - arr[i]) * f
  return { activitySmooth: lerp(m.activity), speed: lerp(m.speed), distance: lerp(m.distance) }
}

// ───────────────────────── frame ─────────────────────────

export type LinePhase = 'raw' | 'strike' | 'clean' | 'lift' | 'done'

export interface PhoneState {
  mode: 'off' | 'listening' | 'dots' | 'line' | 'card' | 'fare'
  line: CompiledLine | null
  phase: LinePhase
  phaseP: number // 0..1 inside the phase
  revealed: number // raw words visible
  langTick: Lang | null
}

export interface MeterState {
  words: number
  ums: number
  langs: Lang[]
  banners: string[]
  waiting: number | null // seconds of silence, in the jam
  flagged: boolean
  final: boolean
}

export interface RideFrame {
  t: number
  scene: Scene
  sceneIndex: number
  act: ActId
  shot: Shot
  shotIndex: number
  shotP: number
  activity: number // instantaneous 0..1
  activitySmooth: number
  speed: number
  distance: number
  silence: number
  phone: PhoneState
  windshield: { line: CompiledLine; p: number } | null // clean line settled on the windshield
  caption: { text: string; speaker: 'sky' | 'other'; id: string } | null
  meter: MeterState
  hold: Hold | null
  holdP: number
  hotspots: Hotspot[]
  collected: CompiledLine[] // clean lines in the trip log so far
  fareRemaining: number | null
}

const { strikeDelay, strike, clean, lift } = config.cleanTiming

export function lineTimes(l: CompiledLine) {
  const s = l.slow ?? 1
  const strikeAt = l.wordEnd + strikeDelay * s
  const cleanAt = strikeAt + strike * s
  const liftAt = cleanAt + clean * s
  const doneAt = liftAt + lift * s
  return { strikeAt, cleanAt, liftAt, doneAt }
}

export function computeFrame(ride: Ride, t: number): RideFrame {
  const scene = sceneAt(t)
  const sceneIndex = scenes.indexOf(scene)
  const { shot, index: shotIndex, p: shotP } = shotAt(t)
  const activity = activityFromWords(ride.voiced, t)
  const silence = silenceAt(ride.voiced, t)
  const motion = motionAt(ride.motion, t)

  // ---- phone ----
  let current: CompiledLine | null = null
  for (const l of ride.phoneLines) if (l.wordStart <= t) current = l
  const phone: PhoneState = { mode: 'listening', line: null, phase: 'done', phaseP: 0, revealed: 0, langTick: null }
  let windshield: RideFrame['windshield'] = null
  if (current) {
    const lt = lineTimes(current)
    const nextStart = ride.phoneLines[ride.phoneLines.indexOf(current) + 1]?.wordStart ?? Infinity
    const ph: [LinePhase, number] =
      t < lt.strikeAt ? ['raw', 0] : t < lt.cleanAt ? ['strike', (t - lt.strikeAt) / (lt.cleanAt - lt.strikeAt)]
        : t < lt.liftAt ? ['clean', (t - lt.cleanAt) / (lt.liftAt - lt.cleanAt)]
          : t < lt.doneAt ? ['lift', (t - lt.liftAt) / (lt.doneAt - lt.liftAt)] : ['done', 0]
    if (ph[0] !== 'done') {
      const revealed = lastWordAt(current.words, t) + 1
      const w = current.words[revealed - 1]
      phone.mode = 'line'
      phone.line = current
      phone.phase = ph[0]
      phone.phaseP = clamp01(ph[1])
      phone.revealed = revealed
      phone.langTick = w && w.lang !== 'en' && t - w.t < 0.6 ? w.lang : null
    }
    if (t >= lt.liftAt && t < nextStart) windshield = { line: current, p: clamp01((t - lt.liftAt) / (lt.doneAt - lt.liftAt)) }
  }
  if (phone.mode !== 'line') phone.mode = t < 12 ? 'listening' : silence > config.silenceDots ? 'dots' : 'listening'
  if (t >= 135 && t < 140) phone.mode = 'card'
  if (t >= config.fare.timerStart + 3 && t < 170) phone.mode = 'fare'

  // ---- caption ----
  let caption: RideFrame['caption'] = null
  for (const l of ride.lines) {
    if (l.captionOnly) {
      if (t >= l.wordStart && t < l.wordEnd + 2.5) caption = { text: l.cleanText, speaker: 'other', id: l.id }
    } else {
      const lt = lineTimes(l)
      const next = ride.phoneLines[ride.phoneLines.indexOf(l) + 1]?.wordStart ?? Infinity
      if (t >= lt.cleanAt && t < Math.min(next, lt.doneAt + 4)) caption = { text: l.cleanText, speaker: 'sky', id: l.id }
    }
  }

  // ---- meter ----
  const words = lastWordAt(ride.counted, t) + 1
  const ums = lastWordAt(ride.fillersAfterFlag, t) + 1
  const vi = lastWordAt(ride.voiced, t)
  const mask = vi >= 0 ? ride.langPrefix[vi] : 0
  const langs = (Object.keys(LANG_BIT) as Lang[]).filter((l) => mask & LANG_BIT[l])
  const flagged = t >= config.flagDownAt
  const banners: string[] = []
  if (!flagged) banners.push('FOR HIRE')
  else if (t < config.flagDownAt + 1.6) banners.push('FLAG DOWN')
  if (scene.act === 'night' || scene.act === 'rain' || scene.act === 'latenight') banners.push('NIGHT RATE')
  const inJam = scene.id === 'jam'
  if (inJam) banners.push('WAITING')
  const final = t >= 135
  if (final && t < 140) banners.push('TOTAL')
  if (t >= 140) banners.push('YOUR FARE')

  // ---- holds / hotspots ----
  const hold = scene.holds.find((h) => t >= h.start && t < h.end) ?? null
  const holdP = hold ? (t - hold.start) / (hold.end - hold.start) : 0
  const hotspots = scene.hotspots.filter((h) => t >= h.start && t < h.end)

  // ---- trip log ----
  const collected = ride.phoneLines.filter((l) => l.log !== false && t >= lineTimes(l).cleanAt)

  return {
    t, scene, sceneIndex, act: scene.act, shot, shotIndex, shotP,
    activity, activitySmooth: motion.activitySmooth, speed: motion.speed, distance: motion.distance, silence,
    phone, windshield, caption,
    meter: { words, ums, langs, banners, waiting: inJam ? Math.floor(Math.min(silence, t - scene.start)) : null, flagged, final },
    hold, holdP, hotspots, collected,
    fareRemaining: t >= config.fare.timerStart && t < 170 ? 170 - t : null,
  }
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Total meter words for the whole ride (booking "fare estimate"). */
export function totalWords(ride: Ride) {
  return ride.counted.filter((w) => w.t < 140).length
}
