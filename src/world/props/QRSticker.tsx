// A generic, scannable QR sticker on the back of the auto (no payment branding). Opens the site.
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { config } from '../../content/config'

export function QRSticker() {
  const [tex, setTex] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(config.siteUrl, { margin: 1, width: 256, color: { dark: '#111111', light: '#ffffff' } }).then((url) => {
      if (!alive) return
      const t = new THREE.TextureLoader().load(url)
      t.colorSpace = THREE.SRGBColorSpace
      t.magFilter = THREE.NearestFilter
      setTex(t)
    }).catch(() => {})
    return () => { alive = false }
  }, [])
  if (!tex) return null
  return (
    <mesh position={[0.46, 0.74, -1.168]} rotation-y={Math.PI}>
      <planeGeometry args={[0.16, 0.16]} />
      <meshStandardMaterial map={tex} roughness={0.6} />
    </mesh>
  )
}
