// S6 Reroute · late night. Narrow wet lanes, metro barricades, a temple lamp, a darshini closing.
import { Darshini, MetroWorks, TempleLamp } from '../world/props/Street'
import { useZ } from './common'

export default function S06Reroute() {
  const [z0, z1] = useZ(96, 101)
  return (
    <group>
      <TempleLamp position={[5.2, 0, z0 + 14]} />
      <Darshini position={[6.4, 0, z1 + 10]} rotationY={-Math.PI / 2} closing />
      <MetroWorks x={-4} z0={z0 - 20} z1={z1 + 50} />
    </group>
  )
}
