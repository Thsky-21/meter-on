// Reads the current shot from the frame and places the camera. Pure f(frame): no internal timers.
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useMemo } from 'react'
import * as THREE from 'three'
import { getFrame } from '../engine/store'
import { liveActivity } from '../engine/voiceActivity'
import { SHOT_DEFAULTS, type Shot, type Vec3 } from './shots'

const easeCache = new Map<string, (p: number) => number>()
export function ease(name = 'sine.inOut') {
  if (!easeCache.has(name)) easeCache.set(name, gsap.parseEase(name) ?? ((p: number) => p))
  return easeCache.get(name)!
}

/** Value-noise shake, deterministic in t. */
function noise(t: number, seed: number) {
  return Math.sin(t * 13.1 + seed) * 0.5 + Math.sin(t * 29.7 + seed * 2.3) * 0.3 + Math.sin(t * 61.3 + seed * 4.1) * 0.2
}

export interface CameraPose { pos: THREE.Vector3; look: THREE.Vector3; fov: number; shake: number; dof: number; focus: number }

const v = (a: Vec3) => new THREE.Vector3(...a)

/** Where the auto is, in world space. Road runs along +z (curves are added by the world kit). */
export function autoTransform(distance: number) {
  const pos = new THREE.Vector3(0, 0, distance)
  return { pos, quat: new THREE.Quaternion() }
}

export function poseFor(shot: Shot, p: number, distance: number, portrait: boolean): CameraPose {
  const d = SHOT_DEFAULTS[shot.type]
  const m = portrait ? shot.mobile ?? {} : {}
  const e = ease(shot.ease)(p)
  const from = v(m.from ?? shot.from)
  const to = v(m.to ?? shot.to ?? m.from ?? shot.from)
  const pos = from.lerp(to, e)
  const look = v(m.lookAt ?? shot.lookAt).lerp(v(shot.lookTo ?? m.lookAt ?? shot.lookAt), e)
  const space = shot.space ?? d.space
  if (space === 'auto') {
    const { pos: ap, quat } = autoTransform(distance)
    pos.applyQuaternion(quat).add(ap)
    look.applyQuaternion(quat).add(ap)
  }
  if (space === 'macro') { pos.add(MACRO_ORIGIN); look.add(MACRO_ORIGIN) }
  return { pos, look, fov: m.fov ?? shot.fov ?? d.fov, shake: d.shake, dof: d.dof, focus: shot.focus ?? pos.distanceTo(look) }
}

/** The chip world (S7) lives far below the road so it never shares a frame with the city. */
export const MACRO_ORIGIN = new THREE.Vector3(0, -500, 0)

export function CameraRig() {
  const { camera, size } = useThree()
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const f = getFrame()
    const portrait = size.height > size.width
    const pose = poseFor(f.shot, f.shotP, f.distance, portrait)
    const act = liveActivity() ?? f.activity
    const amp = pose.shake * (0.004 + 0.012 * act) * (f.speed > 0.2 ? 1 : 0.5)
    pose.pos.x += noise(f.t, 1) * amp
    pose.pos.y += noise(f.t, 7) * amp
    camera.position.copy(pose.pos)
    camera.lookAt(tmp.copy(pose.look))
    const cam = camera as THREE.PerspectiveCamera
    if (Math.abs(cam.fov - pose.fov) > 0.01) { cam.fov = pose.fov; cam.updateProjectionMatrix() }
  })
  return null
}
