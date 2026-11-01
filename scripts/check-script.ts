// npm run check-script — warns when a line's words run past its scene or into the next line,
// and lists placeholders. Uses the same timing code as the app.
import { readFileSync } from 'node:fs'
import { compileLines } from '../src/engine/words.ts'
import type { Script } from '../src/engine/types.ts'

const script: Script = JSON.parse(readFileSync(new URL('../src/content/script.json', import.meta.url), 'utf8'))
let warnings = 0
for (const choice of ['change', 'push'] as const) {
  const lines = compileLines(script, 'Saar', { reroute: choice }).filter((l) => !l.captionOnly)
  for (const [i, l] of lines.entries()) {
    if (choice === 'push' && !l.id.includes('push')) continue
    const scene = script.scenes.find((s) => s.id === l.sceneId)!
    const next = lines[i + 1]
    const src = l.words.some((w) => w.d !== 0.32 && w.d !== 0.9) ? 'whisper' : 'estimated'
    const tag = `${l.id.padEnd(22)} ${l.wordStart.toFixed(2)}–${l.wordEnd.toFixed(2)} (${src})`
    if (l.wordEnd > scene.end) { warnings++; console.log(`⚠ ${tag} runs ${(l.wordEnd - scene.end).toFixed(2)}s past "${scene.id}" end ${scene.end}`) }
    if (next && l.wordEnd > next.wordStart) { warnings++; console.log(`⚠ ${tag} overlaps ${next.id} by ${(l.wordEnd - next.wordStart).toFixed(2)}s`) }
  }
}
const counted = compileLines(script, 'Saar', {}).flatMap((l) => l.words).filter((w) => w.counts && w.t < 140).length
console.log(`\n${warnings} timing warning(s). Meter total at arrival: ${counted} words.`)
