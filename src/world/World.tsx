// The whole world in one place. Every child reads ride time from the store; none keeps its own clock.
import { Auto } from './Auto'
import { City } from './City'
import { Lighting } from './Lighting'
import { MacroWorld } from './MacroWorld'
import { Rain } from './Rain'
import { Road } from './Road'
import { Traffic } from './Traffic'
import { SceneProps } from '../scenes/SceneProps'

export function World() {
  return (
    <>
      <Lighting />
      <Road />
      <City />
      <Traffic />
      <Rain />
      <Auto />
      <SceneProps />
      <MacroWorld />
    </>
  )
}
