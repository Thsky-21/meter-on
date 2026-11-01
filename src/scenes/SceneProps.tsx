// Mounts set dressing for the current stop and its neighbours. Each scene is its own chunk;
// the next one is preloaded while the current one plays.
import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react'
import { useRide } from '../engine/store'
import { scenes } from '../engine/timeline'

const loaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  pickup: () => import('./S01Pickup'),
  mahalingpur: () => import('./S02Mahalingpur'),
  startup: () => import('./S03Startup'),
  build: () => import('./S04Build'),
  jam: () => import('./S05Jam'),
  reroute: () => import('./S06Reroute'),
  voice: () => import('./S07Voice'),
  stickers: () => import('./S08Stickers'),
  arrival: () => import('./S09Arrival'),
  fare: () => import('./S10Fare'),
  triplog: () => import('./S11TripLog'),
}
const lazies: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(Object.entries(loaders).map(([k, l]) => [k, lazy(l)]))

export function SceneProps() {
  const index = useRide((s) => s.frame.sceneIndex)
  useEffect(() => { const next = scenes[index + 1]; if (next) void loaders[next.id]() }, [index])
  const visible = scenes.filter((_, i) => i >= index - 1 && i <= index + 1)
  return (
    <>
      {visible.map((s) => {
        const C = lazies[s.id]
        return <Suspense key={s.id} fallback={null}><C /></Suspense>
      })}
    </>
  )
}
