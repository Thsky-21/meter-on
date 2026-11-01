// Word timing estimation, filler tagging and line compilation.
// Pure and Node-safe (used by scripts/check-script.ts and scripts/import-whisper.ts).
import { config } from '../content/config.ts'
import type { Choices, CompiledLine, Lang, Line, Script, TimedWord, Word } from './types.ts'

const PLACEHOLDER_RE = /\[[^\]]*\]/g

/** Split raw text into display tokens. Bracketed [FILL …] blocks stay one token. */
export function tokenize(text: string): string[] {
  const tokens: string[] = []
  let last = 0
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    tokens.push(...splitPlain(text.slice(last, m.index)))
    // keep trailing punctuation attached to the bracket token
    let end = m.index! + m[0].length
    while (end < text.length && /[.,!?;:]/.test(text[end])) end++
    tokens.push(text.slice(m.index, end))
    last = end
  }
  tokens.push(...splitPlain(text.slice(last)))
  return tokens
}

function splitPlain(s: string): string[] {
  return s.split(/\s+/).filter(Boolean)
}

export const bare = (token: string) => token.toLowerCase().replace(/[^\p{L}\p{N}'&]/gu, '')
export const isPlaceholder = (token: string) => token.startsWith('[')
const isPauseOnly = (token: string) => bare(token) === '' && !isPlaceholder(token) // "…"
const endsComma = (token: string) => /[,;:—–]$|…$/.test(token)
const endsStop = (token: string) => /[.!?]$/.test(token) && !/…$/.test(token)

/** Tag fillers by token. Manual `override[i]` (true/false) always wins. */
export function tagFillers(tokens: string[], override?: (boolean | undefined)[]): boolean[] {
  const out = tokens.map(() => false)
  const words = tokens.map(bare)
  for (const phrase of config.fillers) {
    const parts = phrase.split(' ')
    for (let i = 0; i + parts.length <= words.length; i++) {
      if (parts.every((p, k) => words[i + k] === p)) for (let k = 0; k < parts.length; k++) out[i + k] = true
    }
  }
  for (let i = 0; i < words.length; i++) {
    if (!config.contextualFillers.includes(words[i])) continue
    const prev = tokens[i - 1]
    const startsSentence = i === 0 || (prev !== undefined && (endsStop(prev) || isPauseOnly(prev)))
    const pausedAround = endsComma(tokens[i]) || (prev !== undefined && endsComma(prev))
    if (startsSentence || pausedAround) out[i] = true
  }
  if (override) override.forEach((v, i) => { if (v !== undefined) out[i] = v })
  return out
}

/** Estimate word timings: perWord per token, extra after commas and full stops. */
export function estimateWords(text: string, start: number, langs: Lang[] = ['en']): Word[] {
  const { perWord, afterComma, afterStop, wordDur, placeholderDur } = config.wordTiming
  const tokens = tokenize(text)
  const fillers = tagFillers(tokens)
  const words: Word[] = []
  let t = start
  tokens.forEach((tok, i) => {
    if (isPauseOnly(tok)) { t += afterComma; return } // "…" is a pause, not a word
    const ph = isPlaceholder(tok)
    const d = ph ? placeholderDur : wordDur
    words.push({ w: tok, t: round(t), d, filler: fillers[i], lang: ph ? langs[0] ?? 'en' : 'en' })
    t += ph ? placeholderDur + 0.1 : perWord
    if (endsStop(tok)) t += afterStop
    else if (endsComma(tok)) t += afterComma
  })
  return words
}

const round = (n: number) => Math.round(n * 1000) / 1000

export function fillAddress(s: string, address: string) {
  return s.replaceAll('{address}', address)
}

export function lineApplies(line: Line, choices: Choices): boolean {
  if (!line.when) return true
  const value = (choices as Record<string, string | undefined>)[line.when.choice] ?? defaultChoice(line.when.choice)
  return value === line.when.is
}

let defaults: Record<string, string> = {}
export function registerChoiceDefaults(script: Script) {
  defaults = {}
  for (const s of script.scenes) for (const h of s.holds) if (h.choice && h.default) defaults[h.choice] = h.default
}
const defaultChoice = (choice: string) => defaults[choice]

/** Compile every applicable line into timed, tagged words. Pure f(script, address, choices). */
export function compileLines(script: Script, address: string, choices: Choices): CompiledLine[] {
  registerChoiceDefaults(script)
  const out: CompiledLine[] = []
  for (const scene of script.scenes) {
    for (const line of scene.lines) {
      if (!lineApplies(line, choices)) continue
      const rawText = fillAddress(line.raw, address)
      const cleanText = fillAddress(line.clean, address)
      const source: Word[] = line.words ?? estimateWords(rawText, line.start, line.langs)
      const tokens = source.map((w) => w.w)
      const tagged = tagFillers(tokens, source.map((w) => w.filler))
      const words: TimedWord[] = source.map((w, index) => {
        const placeholder = isPlaceholder(w.w)
        const filler = tagged[index]
        return {
          w: fillAddress(w.w, address),
          t: w.t,
          d: w.d,
          filler,
          placeholder,
          lang: (w.lang ?? 'en') as Lang,
          lineId: line.id,
          index,
          counts: line.speaker === 'sky' && !line.captionOnly && !filler && !placeholder && w.t >= config.flagDownAt,
        }
      })
      const wordStart = words[0]?.t ?? line.start
      const lastW = words[words.length - 1]
      const wordEnd = lastW ? lastW.t + lastW.d : line.start
      out.push({ ...line, sceneId: scene.id, words, wordStart, wordEnd, rawText, cleanText })
    }
  }
  return out.sort((a, b) => a.wordStart - b.wordStart)
}

/** Count clean words in a visitor's transcript using the same filler logic. */
export function analyseTranscript(text: string) {
  const tokens = tokenize(text).filter((t) => !isPauseOnly(t))
  const fillers = tagFillers(tokens)
  const kept: string[] = []
  tokens.forEach((tok, i) => {
    if (!fillers[i]) return void kept.push(tok)
    // 'I, like, build' → 'I build': a removed filler takes the comma before it along
    if (endsComma(tok) && kept.length && kept[kept.length - 1].endsWith(',')) kept[kept.length - 1] = kept[kept.length - 1].slice(0, -1)
  })
  return {
    tokens,
    fillers,
    words: kept.length,
    ums: fillers.filter(Boolean).length,
    clean: cleanSentence(kept.join(' ')),
  }
}

/** Light clean-up of a visitor's kept words: tidy commas, capitalise sentences. */
export function cleanSentence(s: string) {
  return s
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/^[,\s]+/, '')
    .replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, a, b) => a + b.toUpperCase())
    .trim()
}
