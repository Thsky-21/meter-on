// Post-processing: bloom, depth of field (focus follows the shot), grain, vignette, ACES tone mapping.
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { useFrame } from '@react-three/fiber'
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SHOT_DEFAULTS } from '../camera/shots'
import { cameraPose } from '../camera/CameraRig'
import { getFrame } from '../engine/store'
import { Q } from './quality'

export function Effects() {
  const dof = useRef<DepthOfFieldEffect>(null)
  const target = useMemo(() => new THREE.Vector3(), [])
  const ca = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])
  useFrame(() => {
    const f = getFrame()
    if (dof.current) {
      target.copy(cameraPose.look)
      dof.current.target = target
      dof.current.bokehScale = 0.5 + SHOT_DEFAULTS[f.shot.type].dof * 5
    }
  })
  return (
    <EffectComposer multisampling={0}>
      {Q.dof ? <DepthOfField ref={dof} focalLength={0.03} bokehScale={2} height={360} /> : <></>}
      <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.75} />
      {Q.dof ? <ChromaticAberration offset={ca} radialModulation={false} modulationOffset={0} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
      <Vignette eskil={false} offset={0.22} darkness={0.75} />
    </EffectComposer>
  )
}
