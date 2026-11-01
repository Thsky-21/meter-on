import { config } from '../content/config'
import { play, seek } from '../engine/clock'
import { useRide } from '../engine/store'
import { sceneById } from '../engine/timeline'
import { sfx } from '../audio/audio'
import { Fillable, linkFor } from './Overlays'
import { currentReceipt } from './Receipt'

export function TripLog() {
  const t = useRide((s) => s.t)
  const lines = useRide((s) => s.frame.collected)
  const fare = useRide((s) => s.fare)
  if (t < 175) return null
  const rate = (label: string) => {
    void sfx('hornShort')
    const url = linkFor('linkedin')
    if (url) window.open(url, '_blank', 'noopener')
    else { const el = document.getElementById('rate-note'); if (el) el.textContent = `${label} → [FILL: LinkedIn / email in config.links]` }
  }
  const whoNext = async () => {
    const url = window.location.origin
    const text = 'Book an auto. Your driver is a 21-year-old founder. The meter runs on words.'
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: 'Meter On', text, url })
      else { await navigator.clipboard.writeText(url); const el = document.getElementById('next-note'); if (el) el.textContent = 'Link copied.' }
    } catch { /* cancelled */ }
  }
  const rideAgain = () => {
    useRide.setState({ fare: null, hornPresses: 0, stickers: [], overlay: null })
    seek(0)
    play()
  }
  return (
    <div className="page" role="region" aria-label={config.tripLog.title}>
      <div className="page-inner">
        <small style={{ letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>Trip log · Rode with Sky · Meter On</small>
        <h1>{config.tripLog.title}</h1>
        {fare && (fare.skipped ? <p><b>{config.fare.skipLine}</b></p> : (
          <p>You paid {fare.words} words. Best line: “{fare.bestLine}” <button className="linkish" style={{ color: '#8a4b00' }} onClick={() => currentReceipt() && useRide.setState({ overlay: { kind: 'receipt' } })}>Your receipt</button></p>
        ))}
        <ul className="lines">
          {lines.map((l) => {
            const link = linkFor(l.proof)
            return (
              <li key={l.id}>
                <small>{sceneById(l.sceneId)?.name}</small>
                <span><Fillable text={l.cleanText} /> {link && <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>proof ↗</a>}</span>
              </li>
            )
          })}
        </ul>

        <h2>Made by voice</h2>
        <p>Every prompt that built this site was spoken, not typed. <Fillable text={config.tripLog.flowStats} /> · <Fillable text={config.tripLog.spokenPrompts} /></p>
        {config.tripLog.timelapse
          ? <video src={config.tripLog.timelapse} controls muted playsInline style={{ width: '100%', borderRadius: 12 }} />
          : <div className="fill" style={{ border: '2px dashed #c9a66b', borderRadius: 12, padding: 24, textAlign: 'center' }}>[FILL: 20-second time-lapse of building this by voice]</div>}

        <h2>Rate your driver</h2>
        <div className="chips">
          <button className="btn" onClick={() => rate('Hire')}>Hire</button>
          <button className="btn" onClick={() => rate('Strongly hire')}>Strongly hire</button>
        </div>
        <p id="rate-note" className="fill" style={{ marginTop: 10 }} />

        <h2>Who’s next?</h2>
        <p>The auto is already heading to its next pickup.</p>
        <div className="chips">
          <button className="btn" onClick={whoNext}>Send this ride to a friend</button>
          <button className="btn" onClick={rideAgain}>Ride again</button>
          <a className="btn" href="/transcript">Read the transcript</a>
        </div>
        <p id="next-note" style={{ marginTop: 10 }} />
        <p style={{ color: '#7a6a55', fontSize: 13, marginTop: 40 }}>Director’s cut: coming soon. · Built by Sky (Akash Melavanki), by voice. No text-to-speech, ever. SIH 2026 work was a team project.</p>
      </div>
    </div>
  )
}
