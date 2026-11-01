import { config } from '../content/config'
import { seek, play } from '../engine/clock'
import { useRide } from '../engine/store'
import { sceneById } from '../engine/timeline'
import { sfx } from '../audio/audio'
import { Fillable, linkFor } from './Overlays'

export function TripLog() {
  const t = useRide((s) => s.t)
  const lines = useRide((s) => s.frame.collected)
  const fare = useRide((s) => s.fare)
  if (t < 175) return null
  const rate = (label: string) => {
    void sfx('hornShort')
    const url = linkFor('linkedin')
    if (url) window.open(url, '_blank', 'noopener')
    else alertless(label)
  }
  return (
    <div className="page" role="region" aria-label={config.tripLog.title}>
      <div className="page-inner">
        <small style={{ letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>Trip log · Rode with Sky · Meter On</small>
        <h1>{config.tripLog.title}</h1>
        {fare && (fare.skipped ? <p><b>{config.fare.skipLine}</b></p> : <p>You paid {fare.words} words. Best line: “{fare.bestLine}”</p>)}
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
        <p><Fillable text={config.tripLog.flowStats} /> · <Fillable text={config.tripLog.spokenPrompts} /></p>
        <h2>Rate your driver</h2>
        <div className="chips">
          <button className="btn" onClick={() => rate('Hire')}>Hire</button>
          <button className="btn" onClick={() => rate('Strongly hire')}>Strongly hire</button>
          <button className="btn" onClick={() => { useRide.setState({ fare: null, hornPresses: 0, stickers: [] }); seek(0); play() }}>Ride again</button>
        </div>
        <p id="rate-note" className="fill" style={{ marginTop: 10 }} />
      </div>
    </div>
  )
}

function alertless(label: string) {
  const el = document.getElementById('rate-note')
  if (el) el.textContent = `${label} → [FILL: LinkedIn / email in config.links]`
}
