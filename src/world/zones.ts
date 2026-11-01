// What the roadside looks like in each scene. Edit to restyle the city per stop.
export interface ZoneStyle {
  roadWidth: number
  buildings: number // density 0..1
  height: [number, number]
  setback: number // distance from road centre to building fronts
  lamps: boolean
  trees: number // density 0..1
  ground: string
  fields?: boolean
  footpath: boolean
}

const city: ZoneStyle = { roadWidth: 11, buildings: 1, height: [8, 34], setback: 9.5, lamps: true, trees: 0.25, ground: '#2a2724', footpath: true }

export const ZONES: Record<string, ZoneStyle> = {
  pickup: { ...city, height: [6, 18], trees: 0.3 },
  mahalingpur: { roadWidth: 6.5, buildings: 0.06, height: [3, 5], setback: 14, lamps: false, trees: 0.35, ground: '#8a7a3e', fields: true, footpath: false },
  startup: { ...city, height: [14, 48] },
  build: { ...city, height: [10, 40] },
  jam: { ...city, roadWidth: 26, setback: 18, height: [12, 44], trees: 0.1 },
  reroute: { ...city, roadWidth: 7, setback: 6.5, height: [6, 14], trees: 0.15 },
  voice: { ...city, buildings: 0.35, height: [6, 22], setback: 14, trees: 0.4 },
  stickers: { ...city, height: [8, 26] },
  arrival: { ...city, buildings: 0.55, height: [6, 20], setback: 12, trees: 0.5, ground: '#4a4234' },
  fare: { ...city, buildings: 0.55, height: [6, 20], setback: 12, trees: 0.5, ground: '#4a4234' },
  triplog: { ...city, buildings: 0.55, height: [6, 20], setback: 12, trees: 0.5, ground: '#4a4234' },
}
