// Voice activity 0..1 as a pure function of t, from word timings.
// When a real voice track is playing, audio.ts registers a live analyser level that takes over.
import type { TimedWord } from './types.ts'

const DECAY = 0.3 // seconds

/** Words that make sound (fillers included — an "um" still moves the auto a little). */
export function voicedWords(words: TimedWord[]) {
  return words.filter((w) => !w.placeholder || w.d > 0)
}

/** Index of the last word starting at or before t (-1 if none). Words must be sorted by t. */
export function lastWordAt(words: { t: number }[], t: number) {
  let lo = 0, hi = words.length - 1, ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (words[mid].t <= t) { ans = mid; lo = mid + 1 } else hi = mid - 1
  }
  return ans
}

export function activityFromWords(words: TimedWord[], t: number): number {
  const i = lastWordAt(words, t)
  let a = 0
  for (let k = i; k >= 0 && k > i - 4; k--) {
    const w = words[k]
    const end = w.t + w.d
    let v: number
    if (t <= end) {
      const p = (t - w.t) / w.d
      v = 0.82 + 0.18 * Math.sin(Math.PI * p) * (w.filler ? 0.5 : 1)
      if (w.filler) v *= 0.6
    } else v = Math.exp(-(t - end) / DECAY) * (w.filler ? 0.6 : 1)
    if (v > a) a = v
  }
  return a
}

/** Seconds since the last voiced word ended (Infinity before the first word). */
export function silenceAt(words: TimedWord[], t: number): number {
  const i = lastWordAt(words, t)
  if (i < 0) return Infinity
  let end = 0
  for (let k = i; k >= 0 && k > i - 4; k--) end = Math.max(end, words[k].t + words[k].d)
  return Math.max(0, t - end)
}

// ---- live override (real audio analyser / visitor mic) ----
let live: (() => number) | null = null
export function setLiveActivity(fn: (() => number) | null) { live = fn }
export function liveActivity(): number | null { return live ? live() : null }
