import { useEffect, useMemo, useState } from 'react'
import { config, type Address } from '../content/config'
import { setAddress, useRide } from '../engine/store'
import { compileRide, totalWords } from '../engine/timeline'

export function Booking({ onBook }: { onBook: () => void }) {
  const address = useRide((s) => s.address)
  const estimate = useMemo(() => totalWords(compileRide(address, {})), [address])
  return (
    <main className="booking">
      <div className="booking-map" aria-hidden="true"><NightMap /></div>
      <section className="booking-panel">
        <h1>Meter On</h1>
        <p className="tag">Book an auto. Your driver is a 21-year-old founder. The meter runs on words.</p>
        <div className="trip">
          <div className="trip-row"><span className="dot" style={{ background: '#f2c230' }} /><div><small>Pickup</small><div>Mahalingpur, 2005</div></div></div>
          <div className="trip-row"><span className="dot" style={{ background: '#14d1c0' }} /><div><small>Drop</small><div>Wispr Flow India, 2026</div></div></div>
          <div className="trip-row"><span /><div><small>Fare estimate</small><div>~{estimate} words · 3 min</div></div></div>
        </div>
        <div className="driver">
          <div className="avatar" />
          <div><b>Sky</b> · new driver<br /><small style={{ color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{config.auto.plate}</small></div>
        </div>
        <div>
          <small style={{ color: 'var(--muted)' }}>How should Sky call you?</small>
          <div className="chips" role="group" aria-label="How should Sky address you" style={{ marginTop: 8 }}>
            {config.addresses.map((a: Address) => (
              <button key={a} className="chip" aria-pressed={a === address} onClick={() => setAddress(a)}>{a}</button>
            ))}
          </div>
        </div>
        <p className="tag">🔊 This is a voice story. Sound on.</p>
        <button className="big-btn" onClick={onBook}>Book ride</button>
      </section>
    </main>
  )
}

export function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3)
  useEffect(() => {
    if (n === 0) { onDone(); return }
    const id = setTimeout(() => setN(n - 1), 800)
    return () => clearTimeout(id)
  }, [n, onDone])
  return <div className="countdown" aria-live="assertive"><div>Driver arriving<b>{n || ''}</b></div></div>
}

/** Illustrated night map (not a real map provider): a little auto heads to the pickup pin. */
function NightMap() {
  return (
    <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#141a36" /><stop offset="1" stopColor="#06070f" /></radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)" />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M${-50 + i * 50} 0 Q ${80 + i * 40} 300 ${-20 + i * 55} 600`} stroke="#1c2347" strokeWidth={i % 4 === 0 ? 6 : 2} fill="none" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M0 ${30 + i * 62} Q 300 ${i * 60 - 30} 600 ${50 + i * 60}`} stroke="#1a2043" strokeWidth={i % 3 === 0 ? 5 : 2} fill="none" />
      ))}
      <path id="route" d="M110 470 C 200 380, 260 420, 330 300 S 470 160, 500 120" stroke="#f2c230" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" fill="none" />
      <circle cx="110" cy="470" r="10" fill="#f2c230" />
      <text x="128" y="490" fill="#f4f1ea" fontSize="16" fontFamily="Inter">Mahalingpur · 2005</text>
      <circle cx="500" cy="120" r="10" fill="#14d1c0" />
      <text x="360" y="100" fill="#f4f1ea" fontSize="16" fontFamily="Inter">Wispr Flow India · 2026</text>
      <g>
        <rect x="-10" y="-7" width="20" height="14" rx="4" fill="#f2c230" stroke="#1f7a3a" strokeWidth="3" />
        <animateMotion dur="9s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#route" /></animateMotion>
      </g>
    </svg>
  )
}
