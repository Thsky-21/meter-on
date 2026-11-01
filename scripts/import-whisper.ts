// npm run import-voice
//
// For every line in src/content/script.json, looks for:
//   voice/<lineId>.mp3  +  voice/<lineId>.json          (Whisper output with word timestamps)
//   voice/<lineId>.<Address>.mp3 (+ .json)               (optional per-address takes, e.g. fare-1.Machaa.mp3)
// and writes `words` (offset by line.start) and `audio` into script.json, copying audio to public/audio/voice/.
//
// Accepted JSON shapes:
//   openai-whisper  (--word_timestamps True):  { segments: [{ words: [{ word, start, end }] }] }
//   OpenAI API verbose_json (word granularity): { words: [{ word, start, end }] }
//
// Filler tagging stays automatic. A `filler: true|false` you set by hand on a word in script.json is kept
// on re-import (matched by position and text).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from '../src/content/config.ts'
import { bare } from '../src/engine/words.ts'
import type { Lang, Script, Word } from '../src/engine/types.ts'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const scriptPath = join(root, 'src/content/script.json')
const voiceDir = join(root, 'voice')
const outDir = join(root, 'public/audio/voice')
mkdirSync(outDir, { recursive: true })

interface WWord { word: string; start: number; end: number }
function readWhisper(file: string): WWord[] {
  const j = JSON.parse(readFileSync(file, 'utf8'))
  if (Array.isArray(j.words)) return j.words
  if (Array.isArray(j.segments)) return j.segments.flatMap((s: { words?: WWord[] }) => s.words ?? [])
  throw new Error(`${file}: no word timestamps found (run Whisper with word timestamps on)`)
}

const langOf = (w: string): Lang => (/[ಀ-೿]/.test(w) ? 'kn' : /[ऀ-ॿ]/.test(w) ? 'hi' : 'en')
const round = (n: number) => Math.round(n * 1000) / 1000

const script: Script = JSON.parse(readFileSync(scriptPath, 'utf8'))
let imported = 0
for (const scene of script.scenes) {
  for (const line of scene.lines) {
    const base = join(voiceDir, line.id)
    const variants = config.addresses.filter((a) => existsSync(`${base}.${a}.mp3`))
    const jsonFile = existsSync(`${base}.json`) ? `${base}.json` : variants.map((a) => `${base}.${a}.json`).find(existsSync)
    if (!jsonFile) continue

    const old = line.words ?? []
    const words: Word[] = readWhisper(jsonFile).map((w, i) => {
      const text = w.word.trim()
      const word: Word = { w: text, t: round(line.start + w.start), d: round(Math.max(0.05, w.end - w.start)), lang: langOf(text) }
      const prev = old[i]
      if (prev && prev.filler !== undefined && bare(prev.w) === bare(text)) word.filler = prev.filler
      return word
    }).filter((w) => w.w)
    line.words = words

    if (existsSync(`${base}.mp3`)) {
      copyFileSync(`${base}.mp3`, join(outDir, `${line.id}.mp3`))
      line.audio = `voice/${line.id}.mp3`
    }
    if (variants.length) {
      line.audioByAddress = {}
      for (const a of variants) {
        copyFileSync(`${base}.${a}.mp3`, join(outDir, `${line.id}.${a}.mp3`))
        line.audioByAddress[a] = `voice/${line.id}.${a}.mp3`
      }
    }
    imported++
    console.log(`✓ ${line.id.padEnd(22)} ${words.length} words, ${words[0]?.t.toFixed(2)}–${(words.at(-1)!.t + words.at(-1)!.d).toFixed(2)}s${variants.length ? `, ${variants.length} address takes` : ''}`)
  }
}
writeFileSync(scriptPath, JSON.stringify(script, null, 2) + '\n')
console.log(`\nImported ${imported} line(s). Run \`npm run check-script\` to see if any line now runs long.`)
