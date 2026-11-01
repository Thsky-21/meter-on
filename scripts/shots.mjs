// npm run shots -- [outDir] [path] — screenshots at the checkpoint times, plus console errors.
// Needs the dev server (npm run dev) on :5173.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const out = process.argv[2] ?? 'shots'
const base = process.env.BASE ?? 'http://localhost:5173'
const times = (process.env.TIMES ?? '5,20,35,50,70,80,95,110,125,135,150,178').split(',').map(Number)
const viewport = process.env.MOBILE ? { width: 390, height: 844 } : { width: 1280, height: 720 }
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

for (const t of times) {
  await page.goto(`${base}/?t=${t}&still=1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(Number(process.env.WAIT ?? 1500))
  await page.screenshot({ path: `${out}/t${String(t).padStart(3, '0')}.png` })
  console.log('shot', t)
}
if (process.env.PATHS) for (const p of process.env.PATHS.split(',')) {
  await page.goto(`${base}${p}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(Number(process.env.WAIT ?? 2500))
  await page.screenshot({ path: `${out}/${p.replace(/[^\w]+/g, '_')}.png` })
  console.log('shot', p)
}
await browser.close()
console.log(errors.length ? `\n${errors.length} console messages:\n` + [...new Set(errors)].join('\n') : '\nNo console errors or warnings.')
