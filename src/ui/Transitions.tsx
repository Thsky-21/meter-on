// Screen-space transitions and lens effects, all pure functions of t:
// whip-pan streaks, tunnel of light, fades, match-cut flashes, the fare lens flare, raindrops on the windshield.
import { useMemo } from 'react'
import { shots } from '../camera/shots'
import { useRide } from '../engine/store'
import { rainAmount } from '../world/Rain'
import { rand } from '../world/kit'

const clamp = (x: number) => Math.max(0, Math.min(1, x))
const bell = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI))

export function transitionState(t: number) {
  let whip = 0, fade = 0, flash = 0
  for (const s of shots) {
    const d = t - s.start
    if (s.transition === 'whip') whip = Math.max(whip, bell(t, s.start - 0.18, s.start + 0.22))
    if (s.transition === 'fade') fade = Math.max(fade, d < 0 && d > -0.4 ? clamp(1 + d / 0.4) : d >= 0 && d < 0.6 ? 1 - d / 0.6 : 0)
    if (s.transition === 'match') flash = Math.max(flash, bell(t, s.start - 0.15, s.start + 0.25))
  }
  const tunnel = t >= 26.5 && t < 28 ? Math.pow((t - 26.5) / 1.5, 2) : t >= 28 && t < 28.8 ? 1 - (t - 28) / 0.8 : 0
  const flare = bell(t, 139.6, 143.5)
  return { whip, fade, flash, tunnel, flare }
}

export function Transitions() {
  const t = useRide((s) => Math.round(s.t * 30) / 30)
  const pov = useRide((s) => s.frame.shot.type === 'POV')
  const sunrise = useRide((s) => s.frame.act === 'sunrise')
  const s = transitionState(t)
  const rain = pov ? rainAmount(t) : 0
  const drops = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ x: rand(31, i) * 100, y: rand(32, i) * 55, r: 4 + rand(33, i) * 10, s: 0.3 + rand(34, i) })), [])
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {rain > 0.05 && drops.map((d, i) => {
        const y = (d.y + ((t * d.s * 3 + i * 7) % 60)) % 70
        return <span key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${y}%`, width: d.r, height: d.r * 1.3, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.55), rgba(180,200,230,.12) 60%, transparent 70%)', opacity: rain * 0.8, backdropFilter: 'blur(1.5px)' }} />
      })}
      {s.whip > 0 && <div style={{ position: 'absolute', inset: 0, backdropFilter: `blur(${s.whip * 18}px)`, background: `linear-gradient(90deg, transparent, rgba(255,255,255,${s.whip * 0.12}), transparent)` }} />}
      {s.tunnel > 0 && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(255,250,235,${s.tunnel}) ${s.tunnel * 40}%, rgba(255,200,120,${s.tunnel * 0.8}) ${20 + s.tunnel * 60}%, rgba(0,0,0,0) 100%)` }} />}
      {s.fade > 0 && <div style={{ position: 'absolute', inset: 0, background: sunrise ? '#fff6e6' : '#000', opacity: s.fade }} />}
      {s.flash > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fffbe8', opacity: s.flash * 0.85 }} />}
      {s.flare > 0 && <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', background: `radial-gradient(circle at 50% 30%, rgba(255,236,190,${s.flare}) 0, rgba(255,190,110,${s.flare * 0.6}) 12%, rgba(255,140,60,0) 45%), linear-gradient(100deg, transparent 40%, rgba(255,220,160,${s.flare * 0.25}) 50%, transparent 60%)` }} />}
    </div>
  )
}
