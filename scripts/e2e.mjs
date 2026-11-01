// node scripts/e2e.mjs — functional smoke test of the ride systems (dev server on :5173).
import { chromium } from 'playwright'
const base = process.env.BASE ?? 'http://localhost:5173'
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(e.message))
const S = () => page.evaluate(() => { const s = window.__ride.store.getState(); return { t: s.t, words: s.frame.meter.words, ums: s.frame.meter.ums, banners: s.frame.meter.banners, scene: s.frame.scene.id, phone: s.frame.phone.mode, collected: s.frame.collected.length, fare: s.fare, choices: s.choices } })
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1 }

await page.goto(base, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Machaa' }).click()
await page.getByRole('button', { name: 'Book ride' }).click()
await page.waitForTimeout(4500)
let s = await S()
ok(s.t > 0.1 && s.scene === 'pickup', `booking → countdown → ride running (t=${s.t.toFixed(1)})`)

await page.evaluate(() => window.__ride.seek(9.7)); await page.waitForTimeout(200)
s = await S(); ok(s.words === 0 && s.banners.includes('FLAG DOWN'), `flag-down at 9.5: ${s.words} words, ${s.banners}`)

await page.evaluate(() => window.__ride.seek(25)); await page.waitForTimeout(50)
const a = (await S()).words
await page.evaluate(() => window.__ride.seek(60)); await page.waitForTimeout(50)
const b = (await S()).words
await page.evaluate(() => window.__ride.seek(25)); await page.waitForTimeout(50)
ok((await S()).words === a && b > a, `seek is deterministic (t25=${a}, t60=${b}, back to t25=${(await S()).words})`)

await page.goto(base + '/?stop=jam', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Start the meter' }).click()
s = await S(); ok(s.scene === 'jam' && s.banners.includes('WAITING'), `?stop=jam deep link lands in jam with ${s.words} words, banners ${s.banners}`)
await page.evaluate(() => window.__ride.seek(78)); await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Honk to move' }).click()
s = await S(); ok(s.t < 85, `horn press 1: nothing moves (t=${s.t.toFixed(1)})`)
await page.getByRole('button', { name: 'Honk to move' }).click(); await page.waitForTimeout(100)
s = await S(); ok(s.t >= 85, `horn press 2 jumps to 85 (t=${s.t.toFixed(1)})`)

await page.evaluate(() => window.__ride.seek(90.5)); await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Push harder' }).click(); await page.waitForTimeout(1500)
s = await S(); ok(s.t >= 93 && s.choices.reroute === 'push', `reroute choice stored (${s.choices.reroute}), t=${s.t.toFixed(1)}`)

await page.evaluate(() => window.__ride.seek(136)); await page.waitForTimeout(300)
s = await S(); ok(s.phone === 'card' && s.banners.includes('TOTAL'), `arrival: total ${s.words} words, phone ${s.phone}`)
await page.locator('.phone-card').click(); await page.waitForTimeout(400)
const t1 = (await S()).t; await page.waitForTimeout(500)
ok((await S()).t === t1, 'growth page pauses the ride')
await page.getByRole('button', { name: 'Continue the ride' }).click()

await page.evaluate(() => window.__ride.seek(146)); await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Type instead' }).click()
await page.getByLabel('Type your story').fill('Um, so I grew up near the river, uh, and I, like, build radios. You know, small ones.')
s = await S(); ok(s.fare === null, 'fare live (not yet paid)')
await page.getByRole('button', { name: 'Pay fare' }).click(); await page.waitForTimeout(200)
s = await S(); ok(s.t >= 170 && s.fare && s.fare.words > 0, `fare paid: ${s.fare?.words} words, ${s.fare?.ums} ums, best "${s.fare?.bestLine}"`)
await page.evaluate(() => window.__ride.seek(176)); await page.waitForTimeout(300)
ok(await page.getByText('The resume I never had to type').isVisible(), `trip log visible with ${(await S()).collected} clean lines`)

ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`)
await browser.close()
