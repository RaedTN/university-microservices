import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const gateway = 'http://localhost:8088'

function proxy(path: string) {
  return {
    target: gateway,
    bypass(req: { headers: { accept?: string } }) {
      if (req.headers.accept?.includes('text/html')) return path
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': proxy('/index.html'),
      '/students': proxy('/index.html'),
      '/grades': proxy('/index.html'),
      '/rest': proxy('/index.html'),
      '/health': proxy('/index.html'),
      '/courses': proxy('/index.html'),
      '/billing': proxy('/index.html'),
    },
  },
})
