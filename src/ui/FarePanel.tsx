// The fare: the visitor speaks (or types) for up to 30 s. Nothing leaves this page from our code:
// no fetch, no storage. When recognition is not on-device, the browser's own speech service is used
// and the privacy line says so honestly.
import { useEffect, useRef, useState } from 'react'
import { config } from '../content/config'
import { releaseHold } from '../engine/clock'
import { useRide, type FareResult } from '../engine/store'
import { setLiveActivity } from '../engine/voiceActivity'
import { analyseTranscript } from '../engine/words'

type Rec = {
  lang: string; interimResults: boolean; continuous: boolean; processLocally?: boolean
  start(): void; stop(): void; abort(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type RecCtor = { new (): Rec; available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>; install?: (o: { langs: string[]; processLocally: boolean }) => Promise<boolean> }

const SR: RecCtor | undefined = typeof window !== 'undefined'
  ? ((window as unknown as Record<string, RecCtor>).SpeechRecognition ?? (window as unknown as Record<string, RecCtor>).webkitSpeechRecognition)
  : undefined

const FARE_END = 170

export function finishFare(raw: string, skipped = false) {
  const a = analyseTranscript(raw)
  const result: FareResult = { raw, clean: a.clean, words: a.words, ums: a.ums, skipped: skipped || !raw.trim(), bestLine: bestLine(a.clean) }
  useRide.setState({ fare: result, fareLive: null })
  setLiveActivity(null)
  releaseHold(FARE_END)
}

/** Longest clean sentence of 14 words or fewer. */
export function bestLine(clean: string) {
  const sentences = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  const fit = sentences.filter((s) => s.split(/\s+/).length <= 14)
  const pick = (fit.length ? fit : sentences.map((s) => s.split(/\s+/).slice(0, 14).join(' ') + '…'))
    .sort((a, b) => b.length - a.length)[0]
  return pick ?? ''
}

export function FarePanel() {
  const remaining = useRide((s) => (s.frame.fareRemaining === null ? 30 : Math.ceil(s.frame.fareRemaining)))
  const ringP = useRide((s) => (s.frame.fareRemaining ?? 30) / 30)
  const [typing, setTyping] = useState(!SR)
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [local, setLocal] = useState<boolean | null>(null)
  const [note, setNote] = useState(SR ? '' : config.fare.noMicJoke)
  const [lang, setLang] = useState(config.fare.lang)
  const rec = useRef<Rec | null>(null)
  const finalText = useRef('')
  const stream = useRef<MediaStream | null>(null)
  const textRef = useRef('')
  const audioCtx = useRef<AudioContext | null>(null)
  textRef.current = text

  // live meter while speaking or typing
  useEffect(() => {
    const a = analyseTranscript(text)
    useRide.setState({ fareLive: { raw: text, words: a.words, ums: a.ums } })
  }, [text])

  // the clock ran out: settle the fare with whatever was said
  useEffect(() => {
    useRide.setState({ fare: null }) // a fresh fare every time we enter the window
    return () => {
    rec.current?.abort()
    stream.current?.getTracks().forEach((t) => t.stop())
    setLiveActivity(null)
    if (!useRide.getState().fare) {
      const raw = textRef.current
      const a = analyseTranscript(raw)
      useRide.setState({ fare: { raw, clean: a.clean, words: a.words, ums: a.ums, skipped: !raw.trim(), bestLine: bestLine(a.clean) }, fareLive: null })
    }
    void audioCtx.current?.close().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!SR?.available) { setLocal(false); return }
    SR.available({ langs: [lang], processLocally: true })
      .then((s) => setLocal(s === 'available' || s === 'downloadable'))
      .catch(() => setLocal(false))
  }, [lang])

  async function startMic() {
    if (!SR) { setTyping(true); return }
    try {
      if (local && SR.install) await SR.install({ langs: [lang], processLocally: true }).catch(() => false)
      const r = new SR()
      r.lang = lang
      r.interimResults = true
      r.continuous = true
      if (local) r.processLocally = true
      r.onresult = (e) => {
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          if (res.isFinal) finalText.current += res[0].transcript + ' '
          else interim += res[0].transcript
        }
        setText((finalText.current + interim).trim())
      }
      r.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          setTyping(true)
          setNote(config.fare.noMicJoke)
        }
        setListening(false)
      }
      r.onend = () => setListening(false)
      r.start()
      rec.current = r
      setListening(true)
      // LED strip follows the visitor's level (local analyser only, nothing is recorded)
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
        const ctx = (audioCtx.current = new AudioContext())
        const an = ctx.createAnalyser()
        an.fftSize = 512
        ctx.createMediaStreamSource(stream.current).connect(an)
        const buf = new Uint8Array(an.fftSize)
        setLiveActivity(() => {
          an.getByteTimeDomainData(buf)
          let s = 0
          for (const v of buf) s += ((v - 128) / 128) ** 2
          return Math.min(1, Math.sqrt(s / buf.length) * 6)
        })
      } catch { /* level is optional */ }
    } catch {
      setTyping(true)
      setNote(config.fare.noMicJoke)
    }
  }

  function stopMic() {
    rec.current?.stop()
    setListening(false)
  }

  const C = 2 * Math.PI * 46
  return (
    <section className="fare" aria-label="The fare">
      {!typing && (
        <button className={`mic ${listening ? 'on' : ''}`} onClick={listening ? stopMic : startMic} aria-label={listening ? 'Stop listening' : 'Speak your story'}>
          <svg className="ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,.15)" strokeWidth="4" fill="none" />
            <circle cx="50" cy="50" r="46" stroke="#fff" strokeWidth="4" fill="none" strokeDasharray={C} strokeDashoffset={C * (1 - ringP)} />
          </svg>
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
        </button>
      )}
      <div className="hold-note">{remaining}s · {listening ? 'listening…' : typing ? 'type your story' : 'tap to speak'}</div>
      {typing && (
        <textarea aria-label="Type your story" placeholder="Thirty seconds of your story…" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      )}
      {note && <div className="hold-note">{note}</div>}
      <div className="choice-row">
        {!typing && <button className="linkish" onClick={() => { stopMic(); setTyping(true) }}>Type instead</button>}
        {!typing && SR && (
          <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)} className="btn" style={{ height: 30 }}>
            {config.fare.langs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        )}
        <button className="big-btn" style={{ padding: '10px 18px', fontSize: 15 }} disabled={!text.trim()} onClick={() => { stopMic(); finishFare(text) }}>Pay fare</button>
        <button className="linkish" onClick={() => { stopMic(); finishFare('', true) }}>Skip</button>
      </div>
      <p className="privacy">{typing || local ? config.fare.privacyLocal : config.fare.privacyCloud}</p>
    </section>
  )
}
