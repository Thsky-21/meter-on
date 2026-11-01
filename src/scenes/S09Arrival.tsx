// S9 Arrival · sunrise. Empty morning road, long shadows, a big billboard with the words "Wispr Flow"
// (plain text only — no logo, no brand styling).
import { Sign } from '../world/props/Sign'
import { useZ } from './common'

export default function S09Arrival() {
  const [z] = useZ(131)
  return (
    <group>
      <Sign position={[11, 9, z + 34]} rotationY={-Math.PI / 2 + 0.4} size={[14, 5.5]} bg="#f7f1e6" fg="#1d1a16" posts frame="#3a3a3a" lines={[
        { text: 'Wispr Flow', size: 230, weight: 700 },
        { text: 'India, 2026', size: 110, weight: 500 },
      ]} />
    </group>
  )
}
