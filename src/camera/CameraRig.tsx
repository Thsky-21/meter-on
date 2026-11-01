// Reads the current shot from the frame and places the camera. Pure f(frame): no internal timers.
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { getFrame, useRide } from '../engine/store'
import type { Ride } from '../engine/timeline'
import { liveActivity } from '../engine/voiceActivity'
import { autoPose } from '../world/kit'
import { SHOT_DEFAULTS, type Shot, type Vec3 } from './shots'

const easeCache = new Map<string, (p: number) => number>()
export function ease(name = 'sine.inOut') {
  if (!easeCache.has(name)) easeCache.set(name, gsap.parseEase(name) ?? ((p: number) => p))
  return easeCache.get(name)!
}

/** Deterministic shake noise in t. */
function noise(t: number, seed: number) {
  return Math.sin(t * 13.1 + seed) * 0.5 + Math.sin(t * 29.7 + seed * 2.3) * 0.3 + Math.sin(t * 61.3 + seed * 4.1) * 0.2
}

/** The chip world (S7) lives far below the road so it never shares a frame with the city. */
export const MACRO_ORIGIN = new THREE.Vector3(0, -500, 0)

/** Latest camera pose (read by post-processing for focus). */
export const cameraPose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 60 }

const v = (a: Vec3) => new THREE.Vector3(...a)
const Y = new THREE.Vector3(0, 1, 0)

function toSpace(p: THREE.Vector3, shot: Shot, ride: Ride, t: number) {
  const space = shot.space ?? SHOT_DEFAULTS[shot.type].space
  if (space === 'auto') {
    const a = autoPose(ride, t)
    p.applyAxisAngle(Y, a.yaw).add(new THREE.Vector3(a.x, 0, a.z))
  } else if (space === 'anchor') {
    const a = autoPose(ride, shot.anchor ?? shot.end)
    p.add(new THREE.Vector3(a.x, 0, a.z))
  } else if (space === 'macro') p.add(MACRO_ORIGIN)
  return p
}

export function poseFor(shot: Shot, p: number, ride: Ride, t: number, portrait: boolean) {
  const d = SHOT_DEFAULTS[shot.type]
  const m = portrait ? shot.mobile ?? {} : {}
  const e = ease(shot.ease)(p)
  const from = v(m.from ?? shot.from)
  const to = v(m.to ?? shot.to ?? m.from ?? shot.from)
  const pos = toSpace(from.lerp(to, e), shot, ride, t)
  const look = toSpace(v(m.lookAt ?? shot.lookAt).lerp(v(shot.lookTo ?? m.lookAt ?? shot.lookAt), e), shot, ride, t)
  return { pos, look, fov: m.fov ?? shot.fov ?? d.fov, shake: d.shake }
}

/** prefers-reduced-motion → storyboard mode: one still per shot, no shake. */
export const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function CameraRig() {
  const { camera, size } = useThree()
  useFrame(() => {
    const f = getFrame()
    const ride = useRide.getState().ride
    const portrait = size.height > size.width
    const pose = poseFor(f.shot, reducedMotion ? 0.5 : f.shotP, ride, f.t, portrait)
    const act = liveActivity() ?? f.activity
    const amp = reducedMotion ? 0 : pose.shake * (0.003 + 0.01 * act) * (f.speed > 0.2 ? 1 : 0.4)
    // speed-breaker impulses: a short bump every ~11 s of driving
    const bump = f.speed > 2 && !reducedMotion ? Math.max(0, Math.sin(f.distance * 0.09)) ** 40 * 0.03 * pose.shake : 0
    pose.pos.x += noise(f.t, 1) * amp
    pose.pos.y += noise(f.t, 7) * amp + bump
    camera.position.copy(pose.pos)
    camera.lookAt(pose.look)
    cameraPose.pos.copy(pose.pos)
    cameraPose.look.copy(pose.look)
    cameraPose.fov = pose.fov
    const cam = camera as THREE.PerspectiveCamera
    if (Math.abs(cam.fov - pose.fov) > 0.01) { cam.fov = pose.fov; cam.updateProjectionMatrix() }
  })
  return null
}
