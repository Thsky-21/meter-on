# Audio for Meter On

Drop files here with exactly these names. Anything missing is silently skipped (small synthesized
fallbacks play for the SFX). **No copyrighted music or sound. No text-to-speech, ever.**
Record yourself, or use sounds under CC0 / a licence you can show. Keep a note of the source of every file.

## Your voice (via the importer, not by hand)

Put raw takes in `/voice` (project root), one per line id from `src/content/script.json`:

| File | Line |
|---|---|
| `voice/pickup-1.mp3` | Kannada haggle → "this meter counts words" |
| `voice/mahalingpur-1.mp3` | Mahalingpur, small town |
| `voice/msrit-1.mp3` | Why E&I |
| `voice/build-1.mp3` | Hostel room, shipped to npm |
| `voice/jam-1.mp3` | Fifty emails, zero replies |
| `voice/jam-2.mp3` | Honking doesn't help… |
| `voice/reroute-reveal-push.mp3`, `voice/reroute-reveal-change.mp3` | Choice reveals |
| `voice/reroute-1.mp3` | Three rewrites → voice |
| `voice/voice-1.mp3` | Voice at three levels |
| `voice/sticker-1.mp3` … `sticker-3.mp3` | Your three values |
| `voice/arrival-1.mp3` | …Nothing moved until I spoke. |
| `voice/fare-1.Saar.mp3`, `.Madam`, `.Guru`, `.Boss`, `.Machaa` | The fare line, once per address |

Keep the ums. Then run Whisper with word timestamps for each file (same base name, `.json`), and `npm run import-voice`.
See the main README.

## Sound effects (short, mono, -14 LUFS-ish)

| File | Length | What |
|---|---|---|
| `sfx-flagdown.mp3` | 0.5 s | Meter flag-down: mechanical click, then a beep |
| `sfx-tick.mp3` | 0.05 s | Soft tick per counted word (very quiet) |
| `sfx-snap.mp3` | 0.15 s | A line turning clean |
| `sfx-horn.mp3` | 0.9 s | Auto horn, long |
| `sfx-horn-short.mp3` | 0.25 s | Auto horn, short tap |

## Beds (loopable, 30–60 s, stereo)

| File | What |
|---|---|
| `amb-dusk.mp3` | Busy street at dusk, distant horns, a darshini |
| `amb-night.mp3` | City at night, flyover hum |
| `amb-rain.mp3` | Rain on a tin roof / canopy (the jam is near-silent: rain + idle only) |
| `amb-latenight.mp3` | Quiet wet lanes, a temple bell far off |
| `amb-predawn.mp3` | First birds |
| `amb-sunrise.mp3` | Morning, birds, soft traffic |
| `engine-idle.mp3`, `engine-drive.mp3` | Your auto ride from hostel to college (record it!) |
| `music-theme.mp3` | Original music only (an FM-style jingle you write is perfect) |
