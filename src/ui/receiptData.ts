// The receipt lives in the URL hash (#r=…), base64url JSON. The hash is never sent to any server.
export interface ReceiptData {
  v: 1
  a: string // address word
  w: number // words
  u: number // ums removed
  b: string // best clean line
  s: string[] // stickers collected
  r: 'push' | 'change'
  d: string // ISO date
}

export function encodeReceipt(r: ReceiptData) {
  const bytes = new TextEncoder().encode(JSON.stringify(r))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeReceipt(s: string): ReceiptData | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
    const r = JSON.parse(json)
    if (r?.v !== 1 || typeof r.w !== 'number') return null
    return { v: 1, a: String(r.a).slice(0, 12), w: r.w | 0, u: r.u | 0, b: String(r.b ?? '').slice(0, 140), s: (r.s ?? []).slice(0, 3).map(String), r: r.r === 'push' ? 'push' : 'change', d: String(r.d).slice(0, 10) }
  } catch {
    return null
  }
}

export function receiptFromHash(): ReceiptData | null {
  const m = window.location.hash.match(/^#r=([\w-]+)/)
  return m ? decodeReceipt(m[1]) : null
}

export function receiptUrl(r: ReceiptData) {
  return `${window.location.origin}/#r=${encodeReceipt(r)}`
}
