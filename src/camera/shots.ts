// ─────────────────────────────────────────────────────────────────────────────
//  SHOT LIST — this is where you direct.
//
//  One object per shot. Times are ride seconds. Positions are metres.
//  space 'auto'  → from/to/lookAt are relative to the auto (x right, y up, z forward).
//                   The back-seat eye is about [0, 1.25, -0.35].
//  space 'world' → absolute world coordinates (z = distance along the road).
//  space 'macro' → the chip world (S7), a separate set at the origin.
//  from → to is a move over the shot's duration, eased with `ease` (any GSAP ease name).
//  transition: how we get INTO this shot: cut | whip | match | fold | tunnel | fade
//  mobile: overrides for portrait 9:16 (usually wider FOV, camera pulled back).
// ─────────────────────────────────────────────────────────────────────────────

export type ShotType = 'POV' | 'OTS' | 'EXT_WIDE' | 'EXT_FRONT' | 'DRONE' | 'MACRO' | 'MIRROR'
export type Transition = 'cut' | 'whip' | 'match' | 'fold' | 'tunnel' | 'fade'
export type Vec3 = [number, number, number]

export interface Shot {
  scene: string
  start: number
  end: number
  type: ShotType
  space?: 'auto' | 'world' | 'macro'
  from: Vec3
  to?: Vec3
  lookAt: Vec3
  lookTo?: Vec3
  fov?: number
  ease?: string
  transition?: Transition
  /** depth-of-field focus distance (m); defaults by type */
  focus?: number
  mobile?: Partial<Pick<Shot, 'from' | 'to' | 'lookAt' | 'fov'>>
  notes?: string
}

/** Defaults per shot type (FOV in degrees, shake 0..1, depth of field 0..1). */
export const SHOT_DEFAULTS: Record<ShotType, { fov: number; shake: number; dof: number; space: Shot['space'] }> = {
  POV: { fov: 70, shake: 1, dof: 0.15, space: 'auto' },
  OTS: { fov: 50, shake: 0.5, dof: 0.3, space: 'auto' },
  EXT_WIDE: { fov: 54, shake: 0.15, dof: 0.1, space: 'auto' }, // ~35 mm
  EXT_FRONT: { fov: 40, shake: 0.2, dof: 0.6, space: 'auto' }, // ~50 mm, shallow on Sky
  DRONE: { fov: 45, shake: 0, dof: 0, space: 'auto' },
  MACRO: { fov: 35, shake: 0, dof: 1, space: 'macro' },
  MIRROR: { fov: 22, shake: 0.4, dof: 0.8, space: 'auto' },
}

const EYE: Vec3 = [0, 1.25, -0.35] // back-seat eye
const AHEAD: Vec3 = [0, 1.05, 12]
const MIRROR_CAM: Vec3 = [0.05, 1.42, 0.25]
const MIRROR_AT: Vec3 = [0.18, 1.52, 0.95] // the rear-view mirror

export const shots: Shot[] = [
  // ── S1 Pickup · dusk ──────────────────────────────────────────────
  { scene: 'pickup', start: 0, end: 3, type: 'EXT_WIDE', space: 'world', from: [-6, 1.6, 8], to: [-5.5, 1.7, 9], lookAt: [2, 1.2, 18],
    notes: 'Street corner. Lamps flicker on, darshini steam left, metro barricades behind. First auto passes.' },
  { scene: 'pickup', start: 3, end: 7, type: 'EXT_WIDE', space: 'world', from: [-5.5, 1.7, 9], to: [-4.8, 1.5, 12], lookAt: [1.2, 1.0, 18],
    ease: 'power2.out', notes: 'My auto swings in, flags + LED glowing, stops with a jolt.' },
  { scene: 'pickup', start: 7, end: 9, type: 'MIRROR', from: MIRROR_CAM, lookAt: MIRROR_AT, transition: 'cut', notes: "Sky's eyes in the mirror." },
  { scene: 'pickup', start: 9, end: 12, type: 'POV', from: [-0.9, 1.0, -0.6], to: EYE, lookAt: AHEAD, ease: 'power2.inOut',
    mobile: { fov: 82 }, notes: 'Camera sits down: Sky’s back, handlebar, meter. Flag-down 9.5.' },

  // ── S2 Mahalingpur · dusk → golden hour ───────────────────────────
  { scene: 'mahalingpur', start: 12, end: 16, type: 'POV', from: EYE, lookAt: AHEAD, transition: 'fold', mobile: { fov: 82 },
    notes: 'Page-fold: city buildings fold flat and fall away.' },
  { scene: 'mahalingpur', start: 16, end: 24, type: 'EXT_WIDE', from: [-14, 4, -10], to: [-12, 3.5, 6], lookAt: [0, 1, 6], transition: 'cut',
    mobile: { from: [-18, 5, -14], fov: 62 }, notes: 'Two-lane road through fields, [FILL: landmark] far off. Sky small in frame.' },
  { scene: 'mahalingpur', start: 24, end: 28, type: 'POV', from: EYE, lookAt: [-6, 1.6, 10], lookTo: [-7, 1.6, 3], transition: 'cut',
    mobile: { fov: 82 }, notes: 'Painted wall “Mahalingpur · 2005” (hotspot). Tunnel of light 26.5–28.' },

  // ── S3 Startup capital · night ────────────────────────────────────
  { scene: 'startup', start: 28, end: 31, type: 'EXT_WIDE', from: [3.5, 1.2, 9], to: [3, 1.6, 3], lookAt: [0, 1, -2], transition: 'tunnel',
    notes: 'Bursts out of the tunnel. “Welcome to the startup capital”.' },
  { scene: 'startup', start: 31, end: 37, type: 'EXT_FRONT', from: [1.8, 1.4, 4.2], to: [1.6, 1.3, 3.6], lookAt: [0, 1.3, 0.4], transition: 'cut',
    mobile: { from: [2.4, 1.6, 5.4], fov: 52 }, notes: 'Sky driving. MSRIT gate (plain text). Circuit traces race the auto. Hotspot.' },
  { scene: 'startup', start: 37, end: 40, type: 'POV', from: EYE, lookAt: [0.15, 1.15, 0.9], lookTo: AHEAD, transition: 'cut', mobile: { fov: 82 },
    notes: 'Meter shows NIGHT RATE.' },

  // ── S4 First build · night ────────────────────────────────────────
  { scene: 'build', start: 40, end: 46, type: 'OTS', from: [-0.45, 1.55, -0.2], lookAt: [0.2, 1.2, 8], transition: 'whip',
    notes: 'Hostel corridor. Open door: 2 a.m. desk, terminal glow, noodles.' },
  { scene: 'build', start: 46, end: 54, type: 'EXT_WIDE', from: [9, 6, -6], to: [9, 7, 10], lookAt: [0, 1.5, 4], transition: 'cut',
    mobile: { from: [12, 8, -8], fov: 62 }, notes: 'Flyover, gantry shows npm publish. Hoardings, meetup board, darshini below.' },
  { scene: 'build', start: 54, end: 60, type: 'POV', from: EYE, lookAt: [4, 4, 20], lookTo: [2, 2.5, 8], transition: 'cut', mobile: { fov: 82 },
    notes: 'Billboard “Thskyshield · shipped · live on npm” (hotspot). Raindrops at 58.' },

  // ── S5 Silk Board · rain ──────────────────────────────────────────
  { scene: 'jam', start: 60, end: 65, type: 'DRONE', from: [0, 45, -5], to: [0, 32, 0], lookAt: [0, 0, 2], transition: 'cut',
    notes: 'Top-down over the junction. Sea of tail-lights. Auto stuck mid-frame.' },
  { scene: 'jam', start: 65, end: 74, type: 'POV', from: EYE, lookAt: AHEAD, transition: 'cut', mobile: { fov: 82 },
    notes: 'Rain on canopy. 50 / 0 billboard. WAITING. Rider zips past.' },
  { scene: 'jam', start: 74, end: 77, type: 'MIRROR', from: MIRROR_CAM, lookAt: MIRROR_AT, transition: 'cut', notes: "Sky's eyes, quieter." },
  { scene: 'jam', start: 77, end: 85, type: 'POV', from: EYE, lookAt: AHEAD, transition: 'cut', mobile: { fov: 82 }, notes: 'HOLD: Honk to move.' },
  { scene: 'jam', start: 85, end: 90, type: 'POV', from: EYE, lookAt: AHEAD, lookTo: [-4, 1, 10], ease: 'power1.inOut', mobile: { fov: 82 },
    notes: '“Honking doesn’t help…” Rerouting HUD, squeeze into side lane.' },

  // ── S6 Reroute · late night ───────────────────────────────────────
  { scene: 'reroute', start: 90, end: 97, type: 'POV', from: EYE, lookAt: AHEAD, transition: 'cut', mobile: { fov: 82 },
    notes: 'HOLD: push harder / change direction. Then the nav line redraws 3×.' },
  { scene: 'reroute', start: 97, end: 102, type: 'EXT_WIDE', from: [-3.5, 2.2, -7], to: [-2.5, 1.8, 2], lookAt: [0, 1, 8], lookTo: [0, 1, 20], transition: 'cut',
    notes: 'Narrow wet lanes, barricades, temple lamp, darshini closing. Push toward headlight.' },

  // ── S7 Voice, from the silicon up · pre-dawn ──────────────────────
  { scene: 'voice', start: 102, end: 105, type: 'POV', from: [0, 1.0, 3.2], to: [0, 0.95, 2.05], lookAt: [0, 0.95, 1.6], ease: 'power3.in',
    notes: 'Push into the headlight → match-cut.' },
  { scene: 'voice', start: 105, end: 114, type: 'MACRO', from: [-6, 5, 10], to: [4, 3, 4], lookAt: [0, 0.5, 0], lookTo: [2, 0.5, -2], transition: 'match',
    notes: 'Chip city: ESP32 block, mic tower, sound wave → neural layers → LED. “SIH 2026 · team project”.' },
  { scene: 'voice', start: 114, end: 117, type: 'POV', from: [0, 0.95, 2.05], to: EYE, lookAt: [0, 0.95, 6], lookTo: AHEAD, transition: 'match', ease: 'power2.out',
    notes: 'LED becomes the headlight; pull back onto the road.' },
  { scene: 'voice', start: 117, end: 120, type: 'DRONE', from: [0, 22, -20], to: [0, 28, -8], lookAt: [0, 0, 20], transition: 'cut',
    notes: 'Three lanes merge: Chip & mic · AI voice agents · People who speak.' },

  // ── S8 Stickers · pre-dawn ────────────────────────────────────────
  { scene: 'stickers', start: 120, end: 124, type: 'POV', from: EYE, lookAt: [0, 1.0, 6], transition: 'cut', mobile: { fov: 82 },
    notes: 'Stopped behind another auto at a signal. Stickers peel on.' },
  { scene: 'stickers', start: 124, end: 128, type: 'OTS', from: [0.45, 1.45, -0.1], to: [0.35, 1.35, 0.4], lookAt: [0, 1.0, 5.5],
    notes: 'Closer on the sticker panel.' },

  // ── S9 Arrival · sunrise ──────────────────────────────────────────
  { scene: 'arrival', start: 128, end: 133, type: 'EXT_FRONT', from: [2.2, 1.3, 5], to: [1.7, 1.4, 4], lookAt: [0, 1.3, 0.3], transition: 'fade',
    mobile: { from: [2.8, 1.6, 6.2], fov: 52 }, notes: 'Golden light, long shadows, “Wispr Flow” billboard (text only).' },
  { scene: 'arrival', start: 133, end: 135, type: 'MIRROR', from: MIRROR_CAM, lookAt: MIRROR_AT, transition: 'cut', notes: "Sky's eyes, smiling." },
  { scene: 'arrival', start: 135, end: 140, type: 'POV', from: EYE, lookAt: [0.15, 1.1, 0.9], transition: 'cut', mobile: { fov: 82 },
    notes: 'Auto stops. Final total. Phone flips to the growth card.' },

  // ── S10 The fare · sunrise ────────────────────────────────────────
  { scene: 'fare', start: 140, end: 143, type: 'POV', from: EYE, lookAt: [0, 1.4, 0.6], transition: 'cut', mobile: { fov: 82 },
    notes: 'Sky turns in the seat as a silhouette; lens flare hides the face.' },
  { scene: 'fare', start: 143, end: 170, type: 'POV', from: EYE, to: [0, 1.22, -0.25], lookAt: [0, 1.3, 0.8], mobile: { fov: 82 },
    notes: 'HOLD: the fare. Visitor speaks or types.' },

  // ── S11 Trip log · sunrise ────────────────────────────────────────
  { scene: 'triplog', start: 170, end: 175, type: 'DRONE', from: [0, 12, -10], to: [0, 70, -40], lookAt: [0, 0, 10], lookTo: [0, 0, 60], transition: 'fade', ease: 'power2.inOut',
    notes: 'Rise over the route. Voice skyline from the ride.' },
  { scene: 'triplog', start: 175, end: 181, type: 'EXT_WIDE', from: [-6, 2, -4], to: [-5, 2.5, -8], lookAt: [0, 1, 8], transition: 'fade',
    notes: 'Post-credit: auto drives off. Trip log overlays.' },
]
