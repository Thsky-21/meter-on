// S1 Pickup · dusk. Street corner: darshini with steam (frame left), metro works behind, lamps flicker on.
import { Darshini, MetroWorks } from '../world/props/Street'
import { Sign } from '../world/props/Sign'
import { useZ } from './common'

export default function S01Pickup() {
  const [z, zEnd] = useZ(6.8, 12)
  return (
    <group>
      <Darshini position={[9.6, 0, z + 5]} rotationY={-Math.PI / 2} />
      <MetroWorks x={-3.2} z0={z - 60} z1={zEnd + 4} />
      <Sign position={[8.4, 3.2, z - 6]} rotationY={-Math.PI / 2} size={[3.6, 1.1]} bg="#f2e6c8" fg="#7a1b12" lines={[
        { text: '[FILL: ಕನ್ನಡ]', size: 130, font: 'kn' },
        { text: 'AUTO STAND', size: 140, weight: 800 },
      ]} posts />
    </group>
  )
}
