# Meter On v1 — Build Plan (Phase 0)

Source of truth: `METER_ON_CONTEXT.md` + the v1 build prompt. This file is how I plan to build it, and what I need from you first.

---

## 1. Architecture in one picture

```
            ┌─────────────── content (your creative controls) ───────────────┐
            │ script.json   config.ts   shots.ts   assets.ts                 │
            └──────────────┬──────────────────────────────────────────────────┘
                           │ (loaded once, validated at boot)
                           ▼
 clock.ts ──► t (seconds) ──► timeline.ts  = pure f(t, choices) ──► RideFrame
   ▲  rAF loop, rate,                         │
   │  pause/seek, holds                       ├─ scene, act, shot (+ blend 0..1)
   │                                          ├─ active line, word index, phase (raw/strike/clean/lift)
 store.ts (zustand)                           ├─ meter: words, ums removed, langs, banner, waiting secs
   address, choices, stickers,                ├─ activity 0..1 (voiceActivity.ts)
   fare result, ui overlays                   └─ active hold / hotspots
                           │
        ┌──────────────────┼────────────────────┬───────────────────┐
        ▼                  ▼                    ▼                   ▼
   R3F <Canvas>        DOM HUD              audio.ts            /lab, /transcript,
   CameraRig + scenes  Meter, Captions,     voice + buses,      storyboard mode
   (read frame only)   Phone, RouteBar…     seeks with t        (same frame fn)
```

**The rule:** every visual reads `frame = computeFrame(t, choices)`; nothing owns a `setTimeout` or a private clock. Seeking to any `t` (scrub, `?stop=jam`, Remotion later) reproduces the exact same state, including meter totals, because totals are *counted from word timings up to t*, never accumulated.

- **Words are precomputed at boot.** `words.ts` turns every line into a flat, sorted word list `{w, t, d, filler, lang, lineId}` (Whisper timings if present, estimates otherwise). The meter at `t` is a binary search over that list. Cheap enough to run every frame.
- **Holds:** the clock runs through them normally; the scene loops an idle state as `f(t - hold.start)`. Acting = `clock.seek(hold.end)`. Timeout = the clock just arrives. Nothing ever waits on the visitor.
- **Choice-dependent lines** (`reroute-reveal-push` / `-change`) are both in `script.json` with the same start time and a `when: { choice: "reroute", is: "push" }` field. The timeline picks one; default = "change". Seeking past the hold without a choice uses the default.
- **Hot path vs React:** R3F components read the frame in `useFrame` from the store via `getState()` (no React re-render per frame). DOM HUD subscribes with selectors that only change on word/line boundaries.
- **Routing:** no router library; a tiny pathname switch for `/`, `/lab`, `/transcript`, plus `vercel.json` rewrites.
- **Code-splitting:** each scene is a `React.lazy` chunk; `timeline` tells the loader which scene is next so it preloads ~5 s ahead. S1 preloads on the booking screen.

## 2. Phase plan (matches your section 16)

| Phase | Deliverable | Your checkpoint |
|---|---|---|
| 0 | This plan | **Your OK + answers to section 5** |
| 1 | Engine skeleton: full 3:00 with coloured boxes per scene, real meter/phone/captions/holds/route bar/deep links | 12 screenshots |
| 2 | World kit + look dev + CameraRig, `/lab` with one shot per act | **Screenshots, your creative notes** |
| 3 | Scenes S1–S9 per `shots.ts` | 12 screenshots |
| 4 | Hotspots, horn, reroute choice, stickers, GrowthPage | — |
| 5 | Fare, receipt + share URL, QR, TripLog, voice skyline, post-credit | 12 screenshots |
| 6 | Booking/countdown, mobile, reduced motion, `/transcript`, perf, README, TODO_FILL, Vercel preview | 12 screenshots + preview URL |

Given the 4 Nov deadline, I'll aim for phases 1–2 today (Sun 1 Nov) to match your day plan.

## 3. What I'll stub (and how it gets swapped)

| Stub in v1 | Swap later, no code change |
|---|---|
| Word timings estimated (0.38 s/word, +0.25 comma, +0.45 stop) | `voice/<lineId>.mp3` + Whisper JSON → `npm run import-voice` writes `words` + `audio` into `script.json` |
| `voiceActivity` from word timings | Same function returns analyser level when `line.audio` is playing (word-timing envelope stays the fallback) |
| Procedural auto, Sky, city, props | `assets.ts` entry gets a `glb` path; `Auto`/`Sky` render `<Gltf>` when present, procedural otherwise |
| Silent audio | Drop files in `public/audio/` with names from `public/audio/README.md`; missing files are silently skipped |
| All [FILL] text | Visibly marked in `script.json` / `config.ts`, tracked in `TODO_FILL.md` |
| Proof links, Flow stats, WPM | `config.ts`; the TYPING TIME SAVED mode stays hidden until both WPMs are numbers |

`import-whisper` will accept both openai-whisper (`segments[].words[] {word,start,end}`) and OpenAI API `verbose_json` (`words[] {word,start,end}`), offset by `line.start`, re-tag fillers, and keep any `filler` override you set by hand. It runs on Node 24 directly (`node scripts/import-whisper.ts`, native type stripping), so no extra tooling.

I'll also add `npm run check-script`: warns when a line's (estimated or real) words run past its scene end or into the next line, so when your real takes come in you'll see immediately which lines need re-timing.

## 4. Risks (ranked)

1. **Scope vs. 3 days.** This is a lot of 3D. Mitigation: phase 1 makes the ride *complete* with boxes, so every later phase only upgrades visuals. If time runs short, my proposed cut order is: motion blur → page-fold transition (fallback: crossfade) → MACRO neural-layer detail → storyboard stills (fallback: captions-only mode) → hostel corridor interior (fallback: OTS on the street with a lit window).
2. **The privacy line isn't automatically true in Chrome.** Chrome's Web Speech API normally streams audio to Google's servers for recognition; Safari's goes to Apple. "Your voice stays in your browser" would be false there. Recent Chrome supports on-device recognition (`processLocally`). My plan: use on-device when available; otherwise use cloud recognition with an honest line, or fall back to typing. **Needs your call (Q1).**
3. **Fare timing conflict.** The fare hold is 143–170 (27 s) but the ring timer is 30 s. **Q2.**
4. **Mobile GPU budget.** Rain, bloom, DOF and instanced traffic on a mid-range Android. Mitigation: auto quality tiers from day one; low tier drops DOF/motion blur, halves particles, caps DPR at 1.5.
5. **Headless screenshots of WebGL.** Playwright isn't installed; I'll add it as a dev dependency and run Chromium with SwiftShader/ANGLE. Screenshots will be slower and slightly less pretty than your GPU.
6. **Audio autoplay.** Unlocked by the "Book ride" tap, so it's fine as long as every entry goes through booking. Deep links (`?stop=`) show a one-tap "Sound on" chip.
7. **Kannada text rendering in WebGL.** drei `<Text>` needs the actual font file; I'll self-host Noto Sans Kannada (OFL licence) so signboards render correctly.
8. **Receipt link contains the visitor's best line.** It's in the `#` hash (never sent to a server), only when they choose to share. I'll note this in the fare UI copy.

## 5. Questions for you (answer by voice, any order)

**Q1 — Privacy line (important).** Choose:
- (a) **Recommended:** on-device recognition when the browser supports it, with the line "Your voice stays in your browser." When on-device isn't available, show "Speech-to-text is done by your browser's service. Nothing is recorded or stored by this site." and offer typing.
- (b) Only allow on-device; everyone else types.
- (c) Keep your line everywhere (I'd advise against it; it's not accurate in Chrome/Safari).

**Q2 — Fare length.** The window is 143–170 = 27 s. Either (a) **recommended:** start the 30 s timer at 140 under Sky's line, so the visitor gets 30 s and the ride stays 3:00, or (b) shift S10 to 140–173 and S11 to 173–183 (ride becomes 3:03), or (c) make the timer 27 s.

**Q3 — The opening line vs. the flag-down.** `pickup-1` starts at 7.2 and runs ~7 s with estimated timing, past the 9.5 s flag-down. The context says the meter *starts ticking in Gokak*. My default: **words before the flag-down don't count** (meter shows 0 WORDS at 9.5, then counts everything after). OK?

**Q4 — Overlap budget.** With estimated timings, several placeholder lines are longer than their windows (e.g. pickup into Gokak, Gokak's 1.5× slow line). My default: shorten nothing; `check-script` reports it, and your real recordings decide. OK?

**Q5 — The first auto's refusal at 0–3.** Is that line spoken (a second voice) or caption-only? Default: **caption-only**, since we never fake voices and it's not your voice. It won't count on the meter.

**Q6 — Delivery-rider and refusal captions.** Same rule: caption-only, not meter words. OK?

**Q7 — Address forms in the fare line.** Context says you'll record the fare line once per address. In the data I'll model that as `audio: { "Saar": "...", "Madam": "..." }` for `fare-1` only. OK?

**Q8 — Vercel.** Phase 6 deploys a preview. Is the Vercel account connected here the one you want, and should the project be named `meter-on`? I'll ask again before deploying.

## 6. Defaults I'm choosing (all marked [DECIDE] in config, change any time)

- **Auto paint:** Bengaluru green lower body, yellow upper body and front, black canopy (`config.auto.paint`).
- **Sky's face:** minimal — no mouth, two soft eye shapes, mostly lit from behind; eyes are only detailed in MIRROR shots.
- **Caption languages:** English only, with the language toggle stub.
- **Fare recognition language:** `en-IN` default, with `hi-IN` and `kn-IN` offered in a small dropdown (pending Q1, since on-device support differs by language).
- **Referral on receipt:** none (plain "Book your own ride" link) until you decide.
- **Booking map:** abstract SVG of roads with a Gokak → Bengaluru dotted line, not geographically accurate.
- **Sticker values, landmark, Kannada lines:** visible `[FILL]` placeholders.

## 7. Repo hygiene

- `git init` now, one commit per phase (plus small commits inside phases), messages like `phase 1: clock, timeline, meter`.
- No secrets, no analytics, no network calls except loading the site's own assets and fonts.

---

**Waiting for your OK and answers to Q1–Q8 before Phase 1.**
