// S4 First build · night. Hostel corridor (2 a.m. desk), flyover gantries with terminal output,
// startup hoardings, meetup chalkboard, darshini, and the npm billboard (hotspot).
import * as THREE from 'three'
import { Darshini } from '../world/props/Street'
import { Sign } from '../world/props/Sign'
import { hotspotClick, useZ } from './common'

const HOARDINGS = [
  ['Pivot.ly', 'We pivot so you don’t have to.'],
  ['SambarStack', 'Full-stack. Extra chutney.'],
  ['DosaDB', 'Crispy queries. Zero downtime.'],
  ['Traffik.ai', 'ETA: eventually.'],
] // fictional names, Bengaluru jokes [DECIDE: keep / replace]

export default function S04Build() {
  const [zc0, zc1, zG1, zG2, zBill] = useZ(40, 46, 49, 52.5, 56)
  const corridor = Math.max(8, zc1 - zc0)
  return (
    <group>
      {/* hostel corridor: walls and doors close on both sides */}
      <group position={[0, 0, zc0 + corridor / 2 - 2]}>
        {[2.6, -2.6].map((x) => (
          <mesh key={x} position={[x, 1.7, 0]} receiveShadow>
            <boxGeometry args={[0.2, 3.4, corridor + 6]} />
            <meshStandardMaterial color="#c9c3b2" roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[0, 3.4, 0]}><boxGeometry args={[5.4, 0.15, corridor + 6]} /><meshStandardMaterial color="#b8b2a2" /></mesh>
        {Array.from({ length: Math.floor(corridor / 3) }, (_, i) => (
          <mesh key={i} position={[i % 2 ? 2.48 : -2.48, 1.05, -corridor / 2 + 1.5 + i * 3]}>
            <boxGeometry args={[0.05, 2.1, 0.95]} />
            <meshStandardMaterial color="#5c3b22" roughness={0.7} />
          </mesh>
        ))}
        {/* the open door: 2 a.m. desk, terminal glow, noodles */}
        <group position={[2.5, 0, 0.5]}>
          <mesh position={[0.05, 1.05, 0]}><planeGeometry args={[0.01, 0.01]} /></mesh>
          <mesh position={[0.9, 0.75, 0]}><boxGeometry args={[1.0, 0.06, 1.2]} /><meshStandardMaterial color="#6b4a2a" /></mesh>
          <mesh position={[0.9, 0.95, 0]} rotation-z={0.2}><boxGeometry args={[0.02, 0.32, 0.5]} /><meshBasicMaterial color={new THREE.Color('#39ff9c').multiplyScalar(2)} toneMapped={false} /></mesh>
          <mesh position={[0.9, 0.86, 0.45]}><cylinderGeometry args={[0.07, 0.05, 0.14, 12]} /><meshStandardMaterial color="#f2c230" /></mesh>
          <pointLight position={[0.6, 1.1, 0]} color="#5fffb0" intensity={4} distance={4} />
        </group>
      </group>
      {/* flyover gantries with terminal output */}
      {[[zG1, ['$ npm publish', 'npm notice package: @thsky-21/thskyshield']], [zG2, ['+ @thsky-21/thskyshield', 'published · Apache-2.0']]].map(([z, lines], i) => (
        <group key={i} position={[0, 0, (z as number) + 26]}>
          {[6.4, -6.4].map((x) => (
            <mesh key={x} position={[x, 3.8, 0]}><boxGeometry args={[0.3, 7.6, 0.3]} /><meshStandardMaterial color="#4a4a4a" metalness={0.7} /></mesh>
          ))}
          <Sign position={[0, 6.6, 0]} rotationY={Math.PI} size={[11, 1.8]} bg="#04140a" fg="#3dff8f" glow="#3dff8f" lit={1.6} align="left" frame="#222"
            lines={(lines as string[]).map((text) => ({ text, size: 92, font: 'mono' as const }))} />
        </group>
      ))}
      {/* hoardings */}
      {HOARDINGS.map(([name, joke], i) => (
        <Sign key={name} position={[i % 2 ? -9 : 9, 7 + (i % 2), zG1 + 10 + i * 14]} rotationY={i % 2 ? Math.PI / 2 : -Math.PI / 2} size={[8, 4]}
          bg={['#1b1f3a', '#3a1b2a', '#0f2f3a', '#2a2a10'][i]} fg="#fff" lit={0.9} posts frame="#222" lines={[
            { text: name, size: 190, weight: 800 }, { text: joke, size: 90, weight: 500 },
          ]} />
      ))}
      {/* meetup chalkboard + darshini */}
      <Sign position={[7.2, 1.2, zG2 + 6]} rotationY={-Math.PI / 2} size={[1.6, 1.1]} bg="#1e2b24" fg="#f4f1ea" frame="#5c3b22" lines={[
        { text: 'TONIGHT', size: 150, weight: 800 }, { text: 'AI agents meetup', size: 120, weight: 600 }, { text: '7 pm · chai free', size: 100, weight: 500 },
      ]} />
      <Darshini position={[10, 0, zG2 + 16]} rotationY={-Math.PI / 2} />
      {/* the billboard: hotspot */}
      <Sign position={[9, 7.5, zBill + 20]} rotationY={-Math.PI / 2 + 0.35} size={[11, 5]} bg="#0b0b0f" fg="#ffffff" lit={1.5} posts frame="#333"
        onClick={hotspotClick('build', 'npm-billboard')} lines={[
          { text: 'Thskyshield', size: 210, weight: 800 }, { text: 'shipped · live on npm', size: 120, weight: 600, color: '#3dff8f' },
        ]} />
    </group>
  )
}
