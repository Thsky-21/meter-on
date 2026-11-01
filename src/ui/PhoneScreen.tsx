// The co-pilot phone: raw words in grey → fillers strike → clean line snaps white → lifts to the windshield.
// Rendered as DOM in the HUD (phase 1) and mounted on the dashboard in-world (drei <Html transform>).
import { useShallow } from 'zustand/react/shallow'
import { useRide } from '../engine/store'
import { analyseTranscript } from '../engine/words'

export function PhoneScreen({ onCard }: { onCard?: () => void }) {
  const p = useRide(
    useShallow((s) => ({
      mode: s.frame.phone.mode, line: s.frame.phone.line, phase: s.frame.phone.phase, revealed: s.frame.phone.revealed,
      lift: s.frame.phone.phase === 'lift' ? Math.round(s.frame.phone.phaseP * 20) / 20 : 0,
      lang: s.frame.phone.langTick, fare: s.fareLive?.raw ?? '',
    })),
  )
  const struck = p.phase !== 'raw'
  const slow = p.line?.slow ?? 1
  return (
    <div className="phone" role="img" aria-label="Dashboard phone transcript">
      <div className="phone-top">
        <span>{p.mode === 'fare' ? 'YOUR TURN' : 'CO-PILOT'}</span>
        <span className={`phone-lang ${p.lang ? 'on' : ''}`}>{p.lang ? p.lang.toUpperCase() : 'EN'}</span>
      </div>
      <div className="phone-body">
        {p.mode === 'line' && p.line && (
          <>
            <div className={`phone-raw ${p.phase === 'clean' || p.phase === 'lift' ? 'fade' : ''}`} style={{ transitionDuration: `${0.4 * slow}s` }}>
              {p.line.words.slice(0, p.revealed).map((w) => (
                <span key={w.index} className={`w ${w.filler ? 'filler' : ''} ${w.filler && struck ? 'struck' : ''} ${w.placeholder ? 'ph' : ''}`}
                  style={{ transitionDuration: `${0.35 * slow}s` }}>
                  {w.w}{' '}
                </span>
              ))}
            </div>
            {(p.phase === 'clean' || p.phase === 'lift') && (
              <div className="phone-clean" style={{ transform: `translateY(${-60 * p.lift}px) scale(${1 + p.lift * 0.1})`, opacity: 1 - p.lift }}>
                {p.line.cleanText}
              </div>
            )}
          </>
        )}
        {p.mode === 'listening' && <div className="phone-idle"><Wave />LISTENING</div>}
        {p.mode === 'dots' && <div className="phone-idle" aria-label="silence">· · ·</div>}
        {p.mode === 'card' && (
          <button className="phone-card" onClick={onCard}>
            If I joined Wispr Flow India<small>Tap to open →</small>
          </button>
        )}
        {p.mode === 'fare' && <FareTranscript raw={p.fare} />}
      </div>
    </div>
  )
}

function FareTranscript({ raw }: { raw: string }) {
  if (!raw) return <div className="phone-idle"><Wave />YOUR STORY</div>
  const a = analyseTranscript(raw)
  return (
    <>
      <div className="phone-raw">
        {a.tokens.map((tok, i) => (
          <span key={i} className={`w ${a.fillers[i] ? 'filler struck' : ''}`}>{tok} </span>
        ))}
      </div>
      <div className="phone-clean">{a.clean}</div>
    </>
  )
}

function Wave() {
  const a = useRide((s) => Math.round(s.frame.activity * 10) / 10)
  return (
    <div className="phone-wave" aria-hidden="true">
      {[0.5, 0.8, 1, 0.7, 0.4].map((k, i) => <i key={i} style={{ height: `${6 + k * (6 + a * 26)}px` }} />)}
    </div>
  )
}
