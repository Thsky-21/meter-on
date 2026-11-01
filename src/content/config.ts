// Meter On — creative config. Edit freely; everything marked [FILL] / [DECIDE] is tracked in TODO_FILL.md.
// Keep this file free of browser APIs: scripts/ (Node) import it too.

export type ActId = 'dusk' | 'night' | 'rain' | 'latenight' | 'predawn' | 'sunrise'
export type Address = 'Saar' | 'Madam' | 'Guru' | 'Boss' | 'Machaa'

export interface ActLook {
  label: string
  /** UI colour for the route bar and HUD accents */
  ui: string
  sky: [string, string] // zenith, horizon
  fog: string
  fogDensity: number
  sun: { color: string; intensity: number; elevation: number; azimuth: number }
  ambient: { color: string; intensity: number }
  street: string // sodium / street-light colour
  accent: string // screens, LED strip tint
  exposure: number
}

export const config = {
  duration: 180,
  flagDownAt: 9.5,

  // ---- words ----
  wordTiming: { perWord: 0.38, afterComma: 0.25, afterStop: 0.45, wordDur: 0.32, placeholderDur: 0.9 },
  /** Always fillers. Multi-word entries are matched as phrases. */
  fillers: ['um', 'umm', 'uh', 'uhh', 'hmm', 'basically', 'actually', 'matlab', 'and all', 'you know', 'na'],
  /** Fillers only when next to a pause (comma, ellipsis) or starting a sentence. */
  contextualFillers: ['like', 'so'],
  /** Seconds of silence before the phone shows "· · ·" */
  silenceDots: 1.2,
  /** Line display timing (multiplied by line.slow) */
  cleanTiming: { strikeDelay: 0.3, strike: 0.6, clean: 1.4, lift: 0.8 },

  addresses: ['Saar', 'Madam', 'Guru', 'Boss', 'Machaa'] as Address[],
  defaultAddress: 'Saar' as Address,

  // ---- meter ----
  /** [FILL] measured WPM. TYPING TIME SAVED mode stays hidden while either is null. */
  typingWPM: null as number | null,
  speakingWPM: null as number | null,
  rateCard: ['Minimum fare 25 words', 'Every word after: one idea', 'Night rate 1.5x stories'],

  // ---- motion: "nothing moves until you speak" ----
  /** metres per second at full voice activity, per act */
  baseSpeed: { dusk: 9, night: 12, rain: 4, latenight: 8, predawn: 10, sunrise: 7 } as Record<ActId, number>,
  /** fraction of baseSpeed kept during silence, per scene (0 = stops dead) */
  speedFloor: { pickup: 1, mahalingpur: 0.35, startup: 0.35, build: 0.35, jam: 0, reroute: 0.3, voice: 0.4, stickers: 0, arrival: 0.25, fare: 0, triplog: 1 } as Record<string, number>,
  /** Hard stops (seconds): the auto is parked inside these windows (pickup, Silk Board, signal, arrival). */
  parked: [[6.8, 11.2], [62, 85.6], [120.5, 128], [136, 175]] as [number, number][],
  activitySmoothing: 0.6, // seconds

  // ---- fare ----
  fare: {
    timerStart: 140, // the 30 s ring starts under Sky's line (decision Q2)
    lang: 'en-IN',
    langs: [
      { code: 'en-IN', label: 'English (India)' },
      { code: 'hi-IN', label: 'हिन्दी' },
      { code: 'kn-IN', label: 'ಕನ್ನಡ' },
    ],
    privacyLocal: 'Your voice stays in your browser. Nothing is recorded or stored.',
    privacyCloud: "Speech-to-text is done by your browser's speech service. Nothing is recorded or stored by this site.",
    noMicJoke: "Mic's on strike today. Type it — the meter counts typed words too, just grudgingly.",
    skipLine: "This one's on me.",
  },

  // ---- auto [DECIDE: exact paint, check against real Bengaluru autos] ----
  auto: {
    plate: 'KA 05 SKY 21',
    backText: 'SPEAK OK PLEASE',
    paint: { lower: '#1f7a3a', upper: '#f2c230', canopy: '#141414', trim: '#d9d9d9' },
    flags: ['#d7262e', '#f6c515'], // Kannada Rajyotsava red and yellow
  },
  siteUrl: 'https://meter-on.vercel.app', // [FILL] final URL once deployed (QR sticker + share links)

  // ---- links [FILL] ----
  links: {
    npm: 'https://www.npmjs.com/package/@thsky-21/thskyshield',
    linkedin: '[FILL: LinkedIn URL]',
    email: '[FILL: email]',
    devto: '[FILL: dev.to article URL]',
    sih: '[FILL: SIH proof link or leave empty]',
  },

  // ---- growth page ----
  growth: {
    title: 'If I joined Wispr Flow India',
    insight:
      "India is a big share of installs but a small share of revenue (about 14% vs 2%, Oct 2025–Apr 2026, Sensor Tower via TechCrunch). The job isn't awareness. It's conversion.",
    campaign: '[FILL: one specific, cheap, measurable first campaign]',
    evidence: '[FILL: pilot numbers, conversation insights, stress-test findings]',
  },

  // ---- trip log ----
  tripLog: {
    title: 'The resume I never had to type',
    flowStats: '[FILL: Flow stats — words dictated, WPM]',
    spokenPrompts: '[FILL: number of spoken prompts]',
    timelapse: null as string | null, // [FILL] path to a 20 s time-lapse video
  },

  // ---- look per act ----
  acts: {
    dusk: {
      label: 'Dusk', ui: '#f29a3a',
      sky: ['#3b2a4d', '#f2a35e'], fog: '#c98a5a', fogDensity: 0.012,
      sun: { color: '#ffb36b', intensity: 2.2, elevation: 6, azimuth: 250 },
      ambient: { color: '#ffcf9e', intensity: 0.45 }, street: '#ff9a3c', accent: '#ffb347', exposure: 1.0,
    },
    night: {
      label: 'Night', ui: '#3d7bff',
      sky: ['#040a1f', '#13234d'], fog: '#0b1636', fogDensity: 0.02,
      sun: { color: '#7fa8ff', intensity: 0.25, elevation: 40, azimuth: 120 },
      ambient: { color: '#4a6ac0', intensity: 0.45 }, street: '#ffb15c', accent: '#22e1ff', exposure: 1.1,
    },
    rain: {
      label: 'Rain', ui: '#7b8ea8',
      sky: ['#1a2230', '#3a4658'], fog: '#2c3646', fogDensity: 0.035,
      sun: { color: '#9fb0c8', intensity: 0.2, elevation: 50, azimuth: 120 },
      ambient: { color: '#7f94b3', intensity: 0.5 }, street: '#ff9d5c', accent: '#ff3348', exposure: 1.0,
    },
    latenight: {
      label: 'Late night', ui: '#6a4fd6',
      sky: ['#0b0820', '#2a1f55'], fog: '#1e1840', fogDensity: 0.025,
      sun: { color: '#8a7dff', intensity: 0.25, elevation: 35, azimuth: 90 },
      ambient: { color: '#6655bb', intensity: 0.45 }, street: '#ffb15c', accent: '#2ef0d0', exposure: 1.05,
    },
    predawn: {
      label: 'Pre-dawn', ui: '#14d1c0',
      sky: ['#1d1245', '#6e4fa8'], fog: '#45367a', fogDensity: 0.018,
      sun: { color: '#b49cff', intensity: 0.5, elevation: 2, azimuth: 95 },
      ambient: { color: '#8f7ad6', intensity: 0.4 }, street: '#c6b8ff', accent: '#14f1d9', exposure: 1.05,
    },
    sunrise: {
      label: 'Sunrise', ui: '#ffc35a',
      sky: ['#7fb1e6', '#ffd09a'], fog: '#ffd8b0', fogDensity: 0.01,
      sun: { color: '#ffd28a', intensity: 3, elevation: 8, azimuth: 95 },
      ambient: { color: '#ffe6cc', intensity: 0.6 }, street: '#ffffff', accent: '#ffffff', exposure: 1.0,
    },
  } as Record<ActId, ActLook>,
}

export type Config = typeof config
