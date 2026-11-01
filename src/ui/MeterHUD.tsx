import { useShallow } from 'zustand/react/shallow'
import { useRide } from '../engine/store'
import type { Lang } from '../engine/types'
import { SevenSeg } from './SevenSeg'
import { availableModes, meterReading } from './meterModes'

/** Meter fields as primitives so the HUD only re-renders when a number actually changes. */
export function useMeter() {
  const m = useRide(
    useShallow((s) => ({
      words: s.frame.meter.words, ums: s.frame.meter.ums, langs: s.frame.meter.langs.join(','),
      banners: s.frame.meter.banners.join(','), waiting: s.frame.meter.waiting, flagged: s.frame.meter.flagged,
      final: s.frame.meter.final, mode: s.meterMode, vw: s.fareLive?.words ?? null, vu: s.fareLive?.ums ?? null,
    })),
  )
  const langs = (m.langs ? m.langs.split(',') : []) as Lang[]
  const banners = m.banners ? m.banners.split(',') : []
  const reading = meterReading({ ...m, langs, banners, visitorWords: m.vw, visitorUms: m.vu }, m.mode)
  return { ...m, banners, reading }
}

export function MeterHUD() {
  const m = useMeter()
  const cycle = () => useRide.setState({ meterMode: (m.mode + 1) % availableModes().length })
  return (
    <button className="meter" onClick={cycle} aria-label={`Meter: ${m.reading.value} ${m.reading.label}. Tap to change mode.`}>
      <div className="meter-digits"><SevenSeg value={m.reading.value} /></div>
      <div className="meter-label">{m.reading.label}</div>
      <div className="meter-banners">
        {m.banners.filter((b) => b !== 'FOR HIRE').map((b) => (
          <span key={b} className={`meter-banner ${b === 'NIGHT RATE' ? 'soft' : ''}`}>
            {b === 'WAITING' && m.waiting !== null ? `WAITING ${String(m.waiting).padStart(2, '0')}s` : b}
          </span>
        ))}
      </div>
    </button>
  )
}
