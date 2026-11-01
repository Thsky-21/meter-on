import { create } from 'zustand'
import { config, type Address } from '../content/config'
import { compileRide, computeFrame, type Ride, type RideFrame } from './timeline'
import type { Choices } from './types'

export type Overlay = null | { kind: 'hotspot'; id: string } | { kind: 'growth' } | { kind: 'receipt' } | { kind: 'triplog' }

export interface FareResult {
  raw: string
  clean: string
  words: number
  ums: number
  skipped: boolean
  bestLine: string
}

export interface RideState {
  started: boolean
  t: number
  playing: boolean
  rate: 1 | 1.25
  muted: boolean
  address: Address
  choices: Choices
  hornPresses: number
  stickers: string[]
  fare: FareResult | null
  /** live visitor transcript during the fare (not stored anywhere) */
  fareLive: { raw: string; words: number; ums: number } | null
  overlay: Overlay
  captionsOn: boolean
  captionLang: 'en'
  meterMode: number
  ride: Ride
  frame: RideFrame
}

const initialRide = compileRide(config.defaultAddress, {})

export const useRide = create<RideState>(() => ({
  started: false,
  t: 0,
  playing: false,
  rate: 1,
  muted: false,
  address: config.defaultAddress,
  choices: {},
  hornPresses: 0,
  stickers: [],
  fare: null,
  fareLive: null,
  overlay: null,
  captionsOn: true,
  captionLang: 'en',
  meterMode: 0,
  ride: initialRide,
  frame: computeFrame(initialRide, 0),
}))

/** Recompile when the address or choices change; recompute the frame. */
export function setAddress(address: Address) {
  const { choices } = useRide.getState()
  const ride = compileRide(address, choices)
  useRide.setState({ address, ride, frame: computeFrame(ride, useRide.getState().t) })
}

export function setChoice<K extends keyof Choices>(key: K, value: Choices[K]) {
  const { address, choices } = useRide.getState()
  const next = { ...choices, [key]: value }
  const ride = compileRide(address, next)
  useRide.setState({ choices: next, ride, frame: computeFrame(ride, useRide.getState().t) })
}

export function collectSticker(id: string) {
  const { stickers } = useRide.getState()
  if (!stickers.includes(id)) useRide.setState({ stickers: [...stickers, id] })
}

export const getFrame = () => useRide.getState().frame
