// Asset registry. Procedural now; drop in GLB / audio paths later and the world swaps automatically.
// Audio paths are relative to /public/audio. A file that isn't there is simply skipped.

export const assets = {
  models: {
    auto: null as string | null, // e.g. '/models/auto.glb'
    sky: null as string | null, // e.g. '/models/sky.glb'
  },
  fonts: {
    sans: '/fonts/Inter-SemiBold.woff',
    kannada: '/fonts/NotoSansKannada-SemiBold.ttf',
    mono: '/fonts/JetBrainsMono-Bold.ttf',
  },
  audio: {
    sfx: {
      flagdown: 'sfx-flagdown.mp3',
      tick: 'sfx-tick.mp3',
      snap: 'sfx-snap.mp3',
      horn: 'sfx-horn.mp3',
      hornShort: 'sfx-horn-short.mp3',
    },
    ambience: {
      dusk: 'amb-dusk.mp3',
      night: 'amb-night.mp3',
      rain: 'amb-rain.mp3',
      latenight: 'amb-latenight.mp3',
      predawn: 'amb-predawn.mp3',
      sunrise: 'amb-sunrise.mp3',
    } as Record<string, string>,
    music: 'music-theme.mp3',
    engineIdle: 'engine-idle.mp3',
    engineDrive: 'engine-drive.mp3',
  },
}
