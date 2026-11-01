import { useCallback, useEffect, useRef, useState } from 'react'
import { unlockAudio } from '../audio/audio'
import { play, seek, seekStop, startClock, stepStop, togglePlay } from '../engine/clock'
import { useRide } from '../engine/store'
import { sceneById } from '../engine/timeline'
import { Booking, Countdown } from '../ui/Booking'
import { Captions } from '../ui/Captions'
import { Controls } from '../ui/Controls'
import { HoldLayer } from '../ui/Holds'
import { MeterHUD } from '../ui/MeterHUD'
import { HotspotLayer, OverlayLayer } from '../ui/Overlays'
import { PhoneScreen } from '../ui/PhoneScreen'
import { RouteBar } from '../ui/RouteBar'
import { Stage } from '../ui/Stage'
import { TripLog } from '../ui/TripLog'
import { Transitions } from '../ui/Transitions'
import { SceneHUD } from '../ui/SceneHUD'
import { phoneInWorld } from '../world/DashboardPhone'

type Gate = 'booking' | 'countdown' | 'deeplink' | 'ride'

/** URL: ?stop=<sceneId> deep link · ?t=<seconds> (dev) · &still=1 paused frame for screenshots */
function readParams() {
  const q = new URLSearchParams(window.location.search)
  const stop = q.get('stop')
  const t = q.get('t')
  return { stop: stop && sceneById(stop) ? stop : null, t: t !== null ? Number(t) : null, still: q.has('still') }
}

export function RidePage() {
  const params = useRef(readParams()).current
  const [gate, setGate] = useState<Gate>(() => (params.still ? 'ride' : params.stop || params.t !== null ? 'deeplink' : 'booking'))

  useEffect(() => {
    startClock()
    if (params.stop) seekStop(params.stop)
    if (params.t !== null) seek(params.t)
    if (params.still) useRide.setState({ started: true, playing: false })
  }, [params])

  const begin = useCallback(() => {
    useRide.setState({ started: true })
    setGate('ride')
    play()
  }, [])

  const book = () => { unlockAudio(); setGate('countdown') }
  const resumeDeepLink = () => { unlockAudio(); begin() }

  return (
    <>
      <StageWithGestures />
      {gate === 'ride' && <Hud />}
      {gate === 'booking' && <Booking onBook={book} />}
      {gate === 'countdown' && <Countdown onDone={() => { seek(params.t ?? 0); begin() }} />}
      {gate === 'deeplink' && (
        <div className="overlay">
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Hop in at {sceneById(params.stop ?? '')?.name ?? 'this stop'}</h2>
            <p>This is a voice story. Sound on.</p>
            <button className="big-btn" onClick={resumeDeepLink} autoFocus>Start the meter</button>
          </div>
        </div>
      )}
    </>
  )
}

function Hud() {
  const openGrowth = () => useRide.setState({ overlay: { kind: 'growth' } })
  const dock = useRide((s) => !phoneInWorld(s.frame.shot.type) || window.innerHeight > window.innerWidth)
  return (
    <>
      <Transitions />
      <div className="hud">
        <SceneHUD />
        <RouteBar />
        <MeterHUD />
        <HotspotLayer />
        {dock && <div className="phone-dock"><PhoneScreen onCard={openGrowth} /></div>}
        <Captions />
        <HoldLayer />
        <Controls />
      </div>
      <OverlayLayer />
      <TripLog />
    </>
  )
}

/** Tap to pause, swipe for stops (mobile). */
function StageWithGestures() {
  const start = useRef<{ x: number; y: number; time: number } | null>(null)
  const onDown = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY, time: performance.now() } }
  const onUp = (e: React.PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s || !useRide.getState().started) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepStop(dx < 0 ? 1 : -1)
    else if (Math.hypot(dx, dy) < 10 && performance.now() - s.time < 300 && e.pointerType !== 'mouse') togglePlay()
  }
  return <div onPointerDown={onDown} onPointerUp={onUp}><Stage /></div>
}
