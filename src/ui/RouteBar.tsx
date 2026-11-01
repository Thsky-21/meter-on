import { useRef } from 'react'
import { config } from '../content/config'
import { seek } from '../engine/clock'
import { useRide } from '../engine/store'
import { DURATION, scenes } from '../engine/timeline'

/** 11 stops, act-coloured, scrubbable. */
export function RouteBar() {
  const t = useRide((s) => Math.round(s.t * 10) / 10)
  const sceneId = useRide((s) => s.frame.scene.id)
  const track = useRef<HTMLDivElement>(null)
  const scene = scenes.find((s) => s.id === sceneId)!

  const seekFromEvent = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    seek(((clientX - r.left) / r.width) * DURATION)
  }
  const onDown = (e: React.PointerEvent) => {
    track.current!.setPointerCapture(e.pointerId)
    seekFromEvent(e.clientX)
  }
  const onMove = (e: React.PointerEvent) => { if (e.buttons) seekFromEvent(e.clientX) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Home') seek(0)
    if (e.key === 'End') seek(DURATION)
  }

  return (
    <nav className="routebar" aria-label="Route">
      <div className="routebar-label">
        <span>Stop {scene.order}/11</span><b>{scene.name}</b>
      </div>
      <div ref={track} className="routebar-track" role="slider" tabIndex={0} aria-label="Ride position" aria-valuemin={0}
        aria-valuemax={DURATION} aria-valuenow={Math.round(t)} aria-valuetext={`${scene.name}, ${fmt(t)}`}
        onPointerDown={onDown} onPointerMove={onMove} onKeyDown={onKey}>
        {scenes.map((s) => (
          <div key={s.id} title={s.name} className={`routebar-seg ${t >= s.start ? 'on' : ''} ${s.id === sceneId ? 'cur' : ''}`}
            style={{ flex: s.end - s.start, background: config.acts[s.act].ui }} />
        ))}
        <div className="routebar-head" style={{ left: `${(t / DURATION) * 100}%` }} />
      </div>
    </nav>
  )
}

export const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
