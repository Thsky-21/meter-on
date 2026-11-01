// Story HUD moments: "Rerouting…" at Silk Board, and the navigation line redrawing three times (S6).
import { useRide } from '../engine/store'

const SIGNS = ['Kill-switch', 'Containment', 'Governance', 'Indian voice agents']

export function SceneHUD() {
  const t = useRide((s) => Math.round(s.t * 20) / 20)
  if (t >= 85.8 && t < 90) {
    return <div className="scene-hud reroute-chip" role="status">Rerouting…</div>
  }
  if (t >= 93 && t < 97.5) {
    const lt = t - 93
    const step = Math.min(3, Math.floor(lt / 1.1)) // 0..3
    const draw = Math.min(1, (lt % 1.1) / 0.8)
    const paths = [
      'M20 180 C 60 120, 90 100, 120 40',
      'M20 180 C 80 150, 140 140, 180 70',
      'M20 180 C 110 170, 190 150, 230 110',
      'M20 180 C 120 180, 220 170, 280 150',
    ]
    return (
      <div className="scene-hud nav" role="status" aria-label={`Route: ${SIGNS[step]}`}>
        <svg viewBox="0 0 300 200" width="300" height="200">
          {paths.slice(0, step).map((d, i) => <path key={i} d={d} stroke="rgba(255,255,255,.18)" strokeWidth="4" fill="none" strokeDasharray="6 8" />)}
          <path d={paths[step]} stroke="#2ef0d0" strokeWidth="5" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
          <circle cx="20" cy="180" r="7" fill="#fff" />
        </svg>
        <div className="nav-sign">{SIGNS[step]}</div>
      </div>
    )
  }
  return null
}
