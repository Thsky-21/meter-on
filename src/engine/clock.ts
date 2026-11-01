// The one clock. play / pause / seek / rate; holds are real timeline windows.
import { computeFrame, DURATION, scenes, sceneById } from './timeline'
import { useRide } from './store'

type Listener = (t: number, prev: number, seeked: boolean) => void
const listeners = new Set<Listener>()
/** Called every tick with (t, prevT, seeked). Use for edge-triggered SFX only — never for state. */
export function onTick(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn) } }

let raf = 0
let last = 0
let seeked = false

function tick(now: number) {
  raf = requestAnimationFrame(tick)
  const dt = Math.min(0.25, (now - last) / 1000)
  last = now
  const s = useRide.getState()
  const prev = s.t
  let t = prev
  // overlays pause the ride (hotspot card, growth page)
  const paused = !s.playing || (s.overlay !== null && s.overlay.kind !== 'triplog')
  if (!paused) t = Math.min(DURATION, prev + dt * s.rate)
  if (t !== prev || seeked) {
    useRide.setState({ t, frame: computeFrame(s.ride, t) })
    listeners.forEach((fn) => fn(t, prev, seeked))
    seeked = false
  }
  if (t >= DURATION && s.playing) useRide.setState({ playing: false })
}

export function startClock() {
  if (raf) return
  last = performance.now()
  raf = requestAnimationFrame(tick)
}
export function stopClock() { cancelAnimationFrame(raf); raf = 0 }

export function play() { useRide.setState({ playing: true }) }
export function pause() { useRide.setState({ playing: false }) }
export function togglePlay() {
  const s = useRide.getState()
  if (s.t >= DURATION) seek(0)
  useRide.setState({ playing: !s.playing || s.t >= DURATION })
}

export function seek(t: number) {
  const s = useRide.getState()
  const clamped = Math.max(0, Math.min(DURATION, t))
  seeked = true
  useRide.setState({ t: clamped, frame: computeFrame(s.ride, clamped) })
}

/** Jump to the end of a hold window (the visitor acted). */
export function releaseHold(holdEnd: number) { seek(holdEnd) }

export function seekStop(id: string) {
  const sc = sceneById(id)
  if (sc) seek(sc.start)
}

export function stepStop(dir: 1 | -1) {
  const { t } = useRide.getState()
  const i = scenes.findIndex((s) => t >= s.start && t < s.end)
  const cur = i < 0 ? scenes.length - 1 : i
  // "previous" restarts the current stop if we're more than 1.5 s in
  if (dir === -1 && t - scenes[cur].start > 1.5) return seek(scenes[cur].start)
  const next = scenes[Math.max(0, Math.min(scenes.length - 1, cur + dir))]
  seek(next.start)
}

export function setRate(rate: 1 | 1.25) { useRide.setState({ rate }) }
export function toggleMute() { useRide.setState({ muted: !useRide.getState().muted }) }
