import { useRide } from '../engine/store'

/** Screen-space caption layer mirroring the clean line. On by default. */
export function Captions() {
  const cap = useRide((s) => s.frame.caption)
  const on = useRide((s) => s.captionsOn)
  const fareOpen = useRide((s) => s.frame.hold?.kind === 'fare' && s.t > 145.5)
  if (!on || !cap || fareOpen) return null
  return (
    <div className="captions" aria-live="polite">
      <span key={cap.id} className={`caption ${cap.speaker === 'other' ? 'other' : ''}`} lang={/[ಀ-೿]/.test(cap.text) ? 'kn' : 'en'}>
        {cap.text}
      </span>
    </div>
  )
}
