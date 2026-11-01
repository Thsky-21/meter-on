import { useMemo } from 'react'
import { useRide } from '../engine/store'
import { motionAt, sceneById } from '../engine/timeline'
import { laneX } from '../world/kit'
import { openHotspot } from '../ui/Overlays'

/** Road distance where the auto is at ride time t (props are placed relative to this). */
export function useZ(...times: number[]) {
  const ride = useRide((s) => s.ride)
  return useMemo(() => times.map((t) => motionAt(ride.motion, t).distance), [ride, times.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
}

export const laneAt = laneX

/** Click handler for a 3D hotspot prop (only when that hotspot is live). */
export function hotspotClick(sceneId: string, hotspotId: string) {
  return () => {
    const s = useRide.getState()
    const h = sceneById(sceneId)?.hotspots.find((x) => x.id === hotspotId)
    if (h && s.t >= h.start && s.t < h.end) openHotspot(h)
  }
}
