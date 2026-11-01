import { useMemo } from 'react'
import { config } from '../../content/config'
import { textTexture } from '../kit'

/** The rate card hanging on the partition, facing the passenger. */
export function RateCard() {
  const tex = useMemo(() => textTexture({
    w: 768, h: 400, bg: '#f5ecd6', fg: '#2a1a08', border: '#a8341f',
    lines: [{ text: 'RATE CARD', size: 54, weight: 800, color: '#a8341f' }, ...config.rateCard.map((t) => ({ text: t, size: 46, weight: 600 }))],
  }), [])
  return (
    <mesh position={[0.3, 0.86, 0.06]} rotation-y={Math.PI} rotation-x={0.1}>
      <planeGeometry args={[0.3, 0.156]} />
      <meshStandardMaterial map={tex} roughness={0.7} />
    </mesh>
  )
}
