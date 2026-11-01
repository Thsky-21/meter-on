import { config } from '../content/config'
import { compileLines } from '../engine/words'
import { script, sceneById } from '../engine/timeline'
import { fmt } from '../ui/RouteBar'

/** Every line, raw and clean (both reroute variants). */
export default function TranscriptPage() {
  const lines = [
    ...compileLines(script, config.defaultAddress, { reroute: 'change' }),
    ...compileLines(script, config.defaultAddress, { reroute: 'push' }).filter((l) => l.id === 'reroute-reveal-push'),
  ].sort((a, b) => a.wordStart - b.wordStart)
  return (
    <main className="transcript-page">
      <div className="page-inner">
        <h1>Meter On · transcript</h1>
        <p style={{ color: 'var(--muted)' }}>Every line from the ride, as spoken (raw) and as the co-pilot cleaned it. <a href="/">Back to the ride</a></p>
        <table>
          <thead><tr><th>Time</th><th>Stop</th><th>Raw</th><th>Clean</th></tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td style={{ fontFamily: 'var(--mono)' }}>{fmt(l.start)}</td>
                <td>{sceneById(l.sceneId)?.name}{l.when ? ` (${l.when.is})` : ''}</td>
                <td style={{ color: 'var(--muted)' }}>{l.rawText}</td>
                <td>{l.speaker === 'other' ? <i>{l.cleanText}</i> : l.cleanText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
