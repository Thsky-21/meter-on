// Hold windows: real stretches of the timeline. Acting jumps to hold.end; doing nothing just arrives there.
import { releaseHold } from '../engine/clock'
import { setChoice, useRide } from '../engine/store'
import { sfx } from '../audio/audio'
import { FarePanel } from './FarePanel'

export function HoldLayer() {
  const hold = useRide((s) => s.frame.hold)
  const holdP = useRide((s) => Math.round(s.frame.holdP * 100) / 100)
  if (!hold) return null
  if (hold.kind === 'horn') return <HornButton end={hold.end} p={holdP} />
  if (hold.kind === 'choice') return <ChoiceButtons end={hold.end} p={holdP} />
  if (hold.kind === 'fare') return <FarePanel />
  return null
}

function HornButton({ end, p }: { end: number; p: number }) {
  const presses = useRide((s) => s.hornPresses)
  const honk = () => {
    void sfx('horn')
    const n = presses + 1
    useRide.setState({ hornPresses: n })
    if (n >= 2) releaseHold(end)
  }
  return (
    <div className="hold">
      <button className="big-btn" onClick={honk} aria-label="Honk to move">
        {presses === 0 ? 'Honk to move' : 'Honk again?'}
      </button>
      <div className="hold-note">{presses === 0 ? 'Silk Board. Nothing is moving.' : 'Nothing moved.'}</div>
      <div className="hold-ring" style={{ ['--p' as string]: p }} />
      <button className="linkish" onClick={() => releaseHold(end)}>Skip</button>
    </div>
  )
}

function ChoiceButtons({ end, p }: { end: number; p: number }) {
  const pick = (v: 'push' | 'change') => {
    setChoice('reroute', v)
    releaseHold(end)
  }
  return (
    <div className="hold">
      <div className="choice-row">
        <button className="big-btn ghost" onClick={() => pick('push')}>Push harder</button>
        <button className="big-btn" onClick={() => pick('change')}>Change direction</button>
      </div>
      <div className="hold-ring" style={{ ['--p' as string]: p }} />
    </div>
  )
}
