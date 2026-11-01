import { useEffect } from 'react'
import { setRate, stepStop, toggleMute, togglePlay } from '../engine/clock'
import { useRide } from '../engine/store'
import { fmt } from './RouteBar'

const I = {
  play: <svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>,
  pause: <svg viewBox="0 0 16 16"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" /></svg>,
  prev: <svg viewBox="0 0 16 16"><path d="M3 2.5h2v11H3zM14 2.5v11L6 8z" fill="currentColor" /></svg>,
  next: <svg viewBox="0 0 16 16"><path d="M11 2.5h2v11h-2zM2 2.5v11L10 8z" fill="currentColor" /></svg>,
  sound: <svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10L5 10H2zM11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" stroke="currentColor" fill="none" strokeWidth="1.4" /></svg>,
  muted: <svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor" /><path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.4" /></svg>,
}

export function Controls() {
  const playing = useRide((s) => s.playing)
  const muted = useRide((s) => s.muted)
  const rate = useRide((s) => s.rate)
  const t = useRide((s) => Math.floor(s.t))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowLeft') stepStop(-1)
      if (e.key === 'ArrowRight') stepStop(1)
      if (e.key.toLowerCase() === 'm') toggleMute()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="controls" role="toolbar" aria-label="Ride controls">
      <button className="btn" onClick={() => stepStop(-1)} aria-label="Previous stop">{I.prev}</button>
      <button className="btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? I.pause : I.play}</button>
      <button className="btn" onClick={() => stepStop(1)} aria-label="Next stop">{I.next}</button>
      <button className="btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>{muted ? I.muted : I.sound}</button>
      <button className="btn" onClick={() => setRate(rate === 1 ? 1.25 : 1)} aria-label={`Speed ${rate}x`}>{rate}x</button>
      <span className="time">{fmt(t)} / 3:00</span>
    </div>
  )
}
