# Meter On

Book an auto. Your driver is a 21-year-old founder. The meter runs on words.

An interactive, cinematic 3-minute ride through Sky's story, built for the Wispr Flow Hiring Challenge.
Everything (camera, scenes, meter, phone, captions, audio) is a pure function of ride time `t` plus the visitor's choices.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build into dist/
```

| URL | What |
|---|---|
| `/` | Booking → the ride → fare → receipt → trip log |
| `/?stop=jam` | Deep link to a stop (`pickup`, `mahalingpur`, `startup`, `build`, `jam`, `reroute`, `voice`, `stickers`, `arrival`, `fare`, `triplog`) |
| `/?t=80&still=1` | A frozen frame at any time (used for screenshots) |
| `/lab` | Look development: one representative shot per act. `/lab?shot=rain`, add `&q=low` for the mobile tier |
| `/transcript` | Every line, raw and clean |
| `/#r=…` | A shared receipt (opens the friend view) |

Keyboard: Space play/pause · ← → stops · M mute. Mobile: tap to pause, swipe for stops.

## Your creative controls

| File | Controls |
|---|---|
| `src/content/script.json` | Scenes, lines (raw, clean, timing), hotspots, holds |
| `src/camera/shots.ts` | The shot list: one readable object per shot. This is where you direct |
| `src/content/config.ts` | Act colours, auto paint, fillers, speeds, fare copy, links, growth page, trip log |
| `src/world/zones.ts` | What the roadside looks like per stop |
| `src/content/assets.ts` | Swap in GLB models / audio files later |

After editing lines: `npm run check-script` warns about lines that run past their stop or into the next line.
`npm run todo` regenerates `TODO_FILL.md` (every `[FILL]`, `[DECIDE]`, `[PLACEHOLDER]` with file and line).

## Adding your voice (no code changes)

1. Record each line (see `public/audio/README.md` for the list). Keep the ums: they are the messy-to-clean material.
   Save as `voice/<lineId>.mp3`, e.g. `voice/build-1.mp3`. The fare line once per address: `voice/fare-1.Machaa.mp3`.
2. Get word timestamps with Whisper, saving JSON next to each file with the same name:

   ```bash
   # local, open-source whisper
   pip install -U openai-whisper
   whisper voice/build-1.mp3 --model small --language en --word_timestamps True --output_format json --output_dir voice
   ```

   or the OpenAI API with `response_format=verbose_json` and `timestamp_granularities[]=word`, saved as `voice/build-1.json`.
3. Import:

   ```bash
   npm run import-voice
   npm run check-script
   ```

   This writes `words` (offset by each line's start) and `audio` into `script.json` and copies the audio into
   `public/audio/voice/`. The meter, phone, captions, auto speed and voice-reactive lights all follow automatically.
   Fillers are tagged automatically; set `"filler": true|false` on any word in `script.json` to override, and the
   override survives re-imports.

If a real take is longer than its slot, `check-script` tells you; move the line's `start` or tighten the take.

## Tests and screenshots

```bash
npm run dev                      # keep running
npm run e2e                      # booking, meter, seek, deep links, horn, choice, growth, fare, receipt, friend link
npm run shots -- out             # screenshots at t = 5, 20, 35 … 178 (real GPU via ANGLE)
MOBILE=1 npm run shots -- out    # portrait 390×844
```

## How it works

- `engine/clock.ts` is the only clock. Holds are real timeline windows; acting jumps to `hold.end`, doing nothing just arrives. Nothing ever blocks.
- `engine/timeline.ts` turns `t` into a frame: scene, shot, active line and phase (raw → strike → clean → lift), meter (counted from word timings up to `t`, never accumulated), voice activity, holds, hotspots, trip-log lines.
- "Nothing moves until you speak": a precomputed motion table integrates `baseSpeed[act] × smoothed voice activity` so the auto's position is also a pure function of `t`.
- The world is procedural (`src/world`): auto, Sky, zoned city with shader windows and the page-fold, traffic and the Silk Board jam, GPU rain, act lighting, post-processing. Quality tiers are automatic (`?q=high|low` to force) with adaptive resolution.
- `prefers-reduced-motion` switches to storyboard mode: one still per shot, captions on the same timeline.

## Privacy

The visitor's fare stays in their browser: no storage, no analytics, no network calls with their words from this site.
Where the browser supports on-device speech recognition, it's used and the page says "Your voice stays in your browser".
Otherwise the browser's own speech service does recognition and the page says so honestly, with typing as the fallback.
A shared receipt carries the best line in the URL hash (`#r=`), which is never sent to a server.

## Rules this build follows

No real brand logos or look-alikes. "Wispr Flow" appears as plain text inside the story only. MSRIT is plain text.
No copyrighted audio, no real faces, no text-to-speech. The SIH 2026 work is credited as a team project.
