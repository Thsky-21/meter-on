import { useEffect, useRef } from 'react'
import { config } from '../content/config'
import { useRide } from '../engine/store'
import { scenes } from '../engine/timeline'
import type { Hotspot } from '../engine/types'

export const linkFor = (key: string | null | undefined) => {
  if (!key) return null
  const url = (config.links as Record<string, string>)[key] ?? key
  return url.startsWith('http') ? url : null
}
const Fillable = ({ text }: { text: string }) => <span className={/\[(FILL|PLACEHOLDER|DECIDE)/.test(text) ? 'fill' : ''}>{text}</span>

/** Glowing hotspot chips (phase 1). In phase 4 these anchor to the 3D props. */
export function HotspotLayer() {
  const hotspots = useRide((s) => s.frame.hotspots)
  if (!hotspots.length) return null
  return (
    <div className="hotspot-tray">
      {hotspots.map((h) => (
        <button key={h.id} className="hotspot-chip" onClick={() => openHotspot(h)} aria-label={`Open: ${h.title}`}>
          ✦ {h.kind === 'growth' ? 'Open the card' : h.title}
        </button>
      ))}
    </div>
  )
}

export function openHotspot(h: Hotspot) {
  useRide.setState({ overlay: h.kind === 'growth' ? { kind: 'growth' } : { kind: 'hotspot', id: h.id } })
}
const close = () => useRide.setState({ overlay: null })

function useEscape() {
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    btn.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return btn
}

export function HotspotCard({ id }: { id: string }) {
  const h = scenes.flatMap((s) => s.hotspots).find((x) => x.id === id)
  const btn = useEscape()
  if (!h) return null
  const link = linkFor(h.link)
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={h.title} onClick={close}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        {h.image && <img src={h.image} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 12 }} />}
        <h2>{h.title}</h2>
        <p><Fillable text={h.body} /></p>
        <div className="card-actions">
          {link && <a className="btn" href={link} target="_blank" rel="noreferrer">Open link ↗</a>}
          {!link && h.link && <span className="fill" style={{ fontSize: 13 }}>{(config.links as Record<string, string>)[h.link] ?? h.link}</span>}
          <button ref={btn} className="btn" onClick={close}>Back to the ride</button>
        </div>
      </div>
    </div>
  )
}

export function GrowthPage() {
  const g = config.growth
  const btn = useEscape()
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={g.title} onClick={close}>
      <div className="card" style={{ width: 'min(620px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <h2>{g.title}</h2>
        <h3>Insight</h3>
        <p>{g.insight}</p>
        <h3>First campaign</h3>
        <p><Fillable text={g.campaign} /></p>
        <h3>Evidence</h3>
        <p><Fillable text={g.evidence} /></p>
        <div className="card-actions"><button ref={btn} className="btn" onClick={close}>Continue the ride</button></div>
      </div>
    </div>
  )
}

export function OverlayLayer() {
  const overlay = useRide((s) => s.overlay)
  if (!overlay) return null
  if (overlay.kind === 'hotspot') return <HotspotCard id={overlay.id} />
  if (overlay.kind === 'growth') return <GrowthPage />
  return null
}

export { Fillable }
