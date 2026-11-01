import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/** Lists the audio files that actually exist, so the app never requests a missing one. */
function audioManifest(): Plugin {
  const id = 'virtual:audio-manifest'
  const dir = resolve(__dirname, 'public/audio')
  const list = () => (existsSync(dir) ? readdirSync(dir).filter((f) => /\.(mp3|ogg|wav|m4a)$/i.test(f)) : [])
  return {
    name: 'audio-manifest',
    resolveId: (s) => (s === id ? '\0' + id : null),
    load: (s) => (s === '\0' + id ? `export default ${JSON.stringify(list())}` : null),
    configureServer(server) {
      server.watcher.add(dir)
      const reload = (f: string) => {
        if (!f.includes('public') || !/audio/.test(f)) return
        const mod = server.moduleGraph.getModuleById('\0' + id)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

export default defineConfig({
  plugins: [react(), audioManifest()],
  server: { port: 5173 },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: { output: { manualChunks: { three: ['three'], r3f: ['@react-three/fiber', '@react-three/drei'], post: ['@react-three/postprocessing', 'postprocessing'] } } },
  },
})
