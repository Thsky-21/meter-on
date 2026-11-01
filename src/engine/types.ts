import type { ActId } from '../content/config.ts'

export type Lang = 'en' | 'kn' | 'hi'

export interface Word {
  w: string
  t: number
  d: number
  filler?: boolean
  lang?: Lang
}

export interface Line {
  id: string
  speaker: 'sky' | 'other'
  start: number
  raw: string
  clean: string
  words: Word[] | null
  audio: string | null
  audioByAddress?: Record<string, string> | null
  langs?: Lang[]
  captionOnly?: boolean
  status?: 'placeholder'
  slow?: number
  proof?: string | null
  sticker?: string
  /** false = not collected into the trip log */
  log?: boolean
  when?: { choice: string; is: string }
}

export interface Hotspot {
  id: string
  kind?: 'card' | 'growth'
  start: number
  end: number
  title: string
  body: string
  image: string | null
  link: string | null
}

export interface Hold {
  id: string
  start: number
  end: number
  kind: 'horn' | 'choice' | 'fare'
  choice?: string
  options?: string[]
  default?: string
}

export interface Scene {
  id: string
  order: number
  name: string
  start: number
  end: number
  act: ActId
  lines: Line[]
  hotspots: Hotspot[]
  holds: Hold[]
}

export interface Script {
  meta: { title: string; durationTarget: number; version: number }
  scenes: Scene[]
}

/** A word after compilation: timed, tagged, owned by a line. */
export interface TimedWord {
  w: string
  t: number
  d: number
  filler: boolean
  /** [FILL] / [PLACEHOLDER] tokens: shown, never counted */
  placeholder: boolean
  lang: Lang
  lineId: string
  index: number // index inside its line
  counts: boolean // counts on the meter (sky, spoken, non-filler, non-placeholder, after flag-down)
}

export interface CompiledLine extends Line {
  sceneId: string
  words: TimedWord[]
  wordStart: number
  wordEnd: number
  rawText: string
  cleanText: string
}

export interface Choices {
  reroute?: 'push' | 'change'
}
