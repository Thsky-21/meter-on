// Seven-segment digits (SVG). Shared by the HUD meter; Meter.tsx draws the same glyphs on a canvas.
export const SEGMENTS: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc',
  '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '', E: 'afged', r: 'eg', o: 'cdeg',
}

// segment polygons in a 20×34 box
const POLY: Record<string, string> = {
  a: '3,1 17,1 15,4 5,4', b: '17.5,2 18.5,3 18.5,15.5 17,17 15.5,15.5 15.5,5', c: '17,17 18.5,18.5 18.5,31 17.5,32 15.5,29 15.5,18.5',
  d: '5,30 15,30 17,33 3,33', e: '2.5,32 1.5,31 1.5,18.5 3,17 4.5,18.5 4.5,29', f: '3,17 1.5,15.5 1.5,3 2.5,2 4.5,5 4.5,15.5',
  g: '4.5,15.5 15.5,15.5 17,17 15.5,18.5 4.5,18.5 3,17',
}

export function SevenSeg({ value, digits = 4 }: { value: string; digits?: number }) {
  const chars = value.padStart(digits, ' ').slice(-digits).split('')
  return (
    <>
      {chars.map((ch, i) => (
        <svg key={i} viewBox="0 0 20 34" aria-hidden="true" style={{ height: '100%' }}>
          {Object.keys(POLY).map((s) => (
            <polygon key={s} points={POLY[s]} className={(SEGMENTS[ch] ?? '').includes(s) ? 'seg-on' : 'seg-off'} />
          ))}
        </svg>
      ))}
    </>
  )
}

export { POLY as SEGMENT_POLYGONS }
