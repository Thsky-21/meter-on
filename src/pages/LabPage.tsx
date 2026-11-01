// /lab — look development. One representative shot per act (plus the mirror and cabin), frozen in time.
// /lab?shot=rain jumps straight to a preset; ?q=low previews the mobile quality tier.
import { useEffect, useState } from 'react'
import { pause, seek, startClock } from '../engine/clock'
import { useRide } from '../engine/store'
import { Stage } from '../ui/Stage'
import { Transitions } from '../ui/Transitions'

export const LAB_SHOTS = [
  { id: 'dusk', t: 4.6, label: 'Dusk · pickup (EXT_WIDE)' },
  { id: 'mirror', t: 8, label: 'Mirror · Sky’s eyes' },
  { id: 'cabin', t: 11.5, label: 'Dusk · cabin POV' },
  { id: 'golden', t: 20, label: 'Golden hour · Mahalingpur' },
  { id: 'night', t: 34, label: 'Night · EXT_FRONT' },
  { id: 'flyover', t: 50, label: 'Night · flyover' },
  { id: 'rain', t: 63, label: 'Rain · drone' },
  { id: 'rainpov', t: 70, label: 'Rain · POV' },
  { id: 'latenight', t: 99.5, label: 'Late night · lanes' },
  { id: 'predawn', t: 110.5, label: 'Pre-dawn · chip city' },
  { id: 'stickers', t: 127, label: 'Pre-dawn · stickers' },
  { id: 'sunrise', t: 131, label: 'Sunrise · arrival' },
]

export default function LabPage() {
  const initial = new URLSearchParams(window.location.search).get('shot')
  const [cur, setCur] = useState(LAB_SHOTS.find((s) => s.id === initial) ?? LAB_SHOTS[0])
  useEffect(() => {
    startClock()
    useRide.setState({ started: true })
    pause()
    seek(cur.t)
  }, [cur])
  return (
    <>
      <Stage />
      <Transitions />
      <nav className="lab-bar" aria-label="Lab shots">
        {LAB_SHOTS.map((s) => (
          <button key={s.id} className="chip" aria-pressed={s.id === cur.id} onClick={() => setCur(s)}>{s.label}</button>
        ))}
        <button className="chip" onClick={() => useRide.setState({ playing: !useRide.getState().playing })}>▶︎ / ❚❚</button>
      </nav>
      <div className="lab-note">
        <b>{cur.label}</b> · t={cur.t}s. Direct in <code>src/camera/shots.ts</code>, colours in <code>src/content/config.ts</code> (acts), roadside in <code>src/world/zones.ts</code>.
      </div>
    </>
  )
}
