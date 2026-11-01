// Quality tier, chosen once: high on desktop GPUs, low on phones. Override with ?q=high|low.
export type Quality = 'high' | 'low'

function detect(): Quality {
  if (typeof window === 'undefined') return 'high'
  const q = new URLSearchParams(window.location.search).get('q')
  if (q === 'high' || q === 'low') return q
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 600
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4
  return coarse || small || weakCpu ? 'low' : 'high'
}

export const quality: Quality = detect()
export const Q = {
  high: { dpr: [1, 1.5] as [number, number], traffic: 90, rain: 1800, dof: true, reflect: false, shadows: true, buildings: 260 },
  low: { dpr: [1, 1.25] as [number, number], traffic: 40, rain: 700, dof: false, reflect: false, shadows: false, buildings: 140 },
}[quality]
