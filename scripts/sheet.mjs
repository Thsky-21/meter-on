// node scripts/sheet.mjs <dir> <out.png> — contact sheet of every png in dir (4 columns)
import { chromium } from 'playwright'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const [dir, out] = process.argv.slice(2)
const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(join(dir, f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`).join('')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1600, height: 400 } })
await p.setContent(`<style>body{margin:0;background:#111;color:#ccc;font:12px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:4px}figure{margin:0}img{width:100%;display:block}</style>${imgs}`)
await p.screenshot({ path: out, fullPage: true })
await b.close()
