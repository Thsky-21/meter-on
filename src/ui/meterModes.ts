import { config } from '../content/config'
import type { MeterState } from '../engine/timeline'

export interface MeterReading { value: string; label: string }

export interface MeterInput extends MeterState { visitorWords: number | null; visitorUms: number | null }

const modes = [
  { id: 'words', label: 'WORDS' },
  { id: 'ums', label: 'UMS REMOVED' },
  { id: 'langs', label: 'LANGUAGES' },
  { id: 'saved', label: 'TYPING SEC SAVED' },
] as const

export function availableModes() {
  return modes.filter((m) => m.id !== 'saved' || (config.typingWPM && config.speakingWPM))
}

/** Shared by the HUD and the in-world meter so they always agree. */
export function meterReading(m: MeterInput, modeIndex: number): MeterReading {
  const list = availableModes()
  const mode = list[modeIndex % list.length]
  if (!m.flagged) return { value: '----', label: 'FOR HIRE' }
  const words = m.visitorWords ?? m.words
  const ums = m.visitorUms ?? m.ums
  switch (mode.id) {
    case 'words': return { value: String(words), label: m.visitorWords !== null ? 'YOUR WORDS' : 'WORDS' }
    case 'ums': return { value: String(ums), label: mode.label }
    case 'langs': return { value: String(Math.max(1, m.langs.length)), label: m.langs.length ? `LANG ${m.langs.join('·').toUpperCase()}` : 'LANGUAGES' }
    case 'saved': {
      const saved = (words / config.typingWPM! - words / config.speakingWPM!) * 60
      return { value: String(Math.max(0, Math.round(saved))), label: mode.label }
    }
  }
}
