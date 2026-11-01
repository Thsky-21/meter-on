// The ride receipt: a 1080×1920 story card. Download as PNG, copy the link, or share.
import { toPng } from 'html-to-image'
import { useMemo, useRef, useState } from 'react'
import { config } from '../content/config'
import { useRide } from '../engine/store'
import { scenes } from '../engine/timeline'
import { encodeReceipt, receiptUrl, type ReceiptData } from './receiptData'

export function currentReceipt(): ReceiptData | null {
  const s = useRide.getState()
  if (!s.fare || s.fare.skipped) return null
  return { v: 1, a: s.address, w: s.fare.words, u: s.fare.ums, b: s.fare.bestLine, s: s.stickers, r: s.choices.reroute ?? 'change', d: new Date().toISOString().slice(0, 10) }
}

function RouteDoodle() {
  const pts = scenes.map((_, i) => [80 + (i / 10) * 760, 140 + Math.sin(i * 1.3) * 70 + (i % 3) * 18] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  return (
    <svg viewBox="0 0 920 300" width="920" height="300" aria-hidden="true">
      <path d={d} stroke="#1b1300" strokeWidth="6" strokeDasharray="4 14" strokeLinecap="round" fill="none" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 || i === 10 ? 18 : 10} fill={config.acts[scenes[i].act].ui} stroke="#1b1300" strokeWidth="4" />)}
      <text x="60" y="280" fontSize="30" fontWeight="700" fill="#1b1300">Mahalingpur, 2005</text>
      <text x="860" y="40" fontSize="30" fontWeight="700" fill="#1b1300" textAnchor="end">Wispr Flow India, 2026</text>
    </svg>
  )
}

/** The full-size card (1080×1920). Rendered scaled down on screen, captured at full size for the PNG. */
export function ReceiptCard({ r, innerRef }: { r: ReceiptData; innerRef?: React.Ref<HTMLDivElement> }) {
  const row = (k: string, v: string | number) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px dashed #1b130033', padding: '22px 0', fontSize: 44 }}>
      <span style={{ opacity: 0.7 }}>{k}</span><b>{v}</b>
    </div>
  )
  return (
    <div ref={innerRef} style={{ width: 1080, height: 1920, background: 'linear-gradient(180deg, #ffd38a, #fff4e0 40%, #fffaf2)', color: '#1b1300',
      fontFamily: 'Inter, sans-serif', padding: '90px 80px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ fontSize: 34, letterSpacing: 8, fontWeight: 800 }}>RIDE RECEIPT · {config.auto.plate}</div>
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>Meter On</div>
      <RouteDoodle />
      {row('Passenger', r.a)}
      {row('Fare paid', `${r.w} words`)}
      {row('Ums removed', r.u)}
      {row('Stickers collected', `${r.s.length} / 3`)}
      {row('At Silk Board, you chose', r.r === 'push' ? 'Push harder' : 'Change direction')}
      <div style={{ marginTop: 20, fontSize: 34, opacity: 0.7 }}>Your best line</div>
      <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1 }}>“{r.b || '…'}”</div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 36 }}>
        <div><b>Rode with Sky · Meter On</b><br /><span style={{ opacity: 0.7 }}>{r.d}</span></div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', background: '#1b1300', color: '#ff2a2a', padding: '14px 22px', borderRadius: 14, fontSize: 64 }}>{String(r.w).padStart(4, '0')}</div>
      </div>
    </div>
  )
}

export function ReceiptOverlay({ r, friend, onClose }: { r: ReceiptData; friend?: boolean; onClose: () => void }) {
  const card = useRef<HTMLDivElement>(null)
  const [note, setNote] = useState('')
  const url = useMemo(() => receiptUrl(r), [r])
  const text = `I paid my fare in words: ${r.w}. “${r.b}” — ride with Sky on Meter On`
  const mobile = typeof navigator !== 'undefined' && 'share' in navigator && matchMedia('(pointer: coarse)').matches
  const scale = Math.min(0.32, (window.innerHeight - 220) / 1920)

  const download = async () => {
    if (!card.current) return
    try {
      const png = await toPng(card.current, { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true })
      const a = document.createElement('a')
      a.href = png
      a.download = `meter-on-receipt-${encodeReceipt(r).slice(0, 6)}.png`
      a.click()
      setNote('Saved.')
    } catch { setNote('Could not render the image in this browser.') }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setNote('Link copied.') } catch { setNote(url) }
  }
  const share = async () => { try { await navigator.share({ title: 'Meter On', text, url }) } catch { /* cancelled */ } }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Your ride receipt">
      <div className="card" style={{ width: 'min(760px, 100%)', display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ width: 1080 * scale, height: 1920 * scale, overflow: 'hidden', borderRadius: 12, flex: 'none' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}><ReceiptCard r={r} innerRef={card} /></div>
        </div>
        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2>{friend ? 'Your friend paid this fare.' : 'Fare paid. Here’s your receipt.'}</h2>
          {friend && <p>Book your own ride. The meter runs on words.</p>}
          {!friend && <>
            <button className="btn" onClick={download}>Download PNG</button>
            <button className="btn" onClick={copy}>Copy link</button>
            {mobile ? <button className="btn" onClick={share}>Share…</button> : <>
              <a className="btn" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`}>Share on WhatsApp</a>
              <a className="btn" target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}>Share on LinkedIn</a>
              <a className="btn" target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>Share on X</a>
            </>}
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>The link carries your best line inside it (after the #). It is never sent to our server.</p>
          </>}
          {note && <p role="status" style={{ margin: 0 }}>{note}</p>}
          <button className="big-btn" onClick={onClose}>{friend ? 'Book your own ride' : 'Continue to the trip log'}</button>
        </div>
      </div>
    </div>
  )
}
