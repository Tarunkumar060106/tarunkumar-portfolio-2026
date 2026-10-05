import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The build-time SSR bundle (pre-rendering) inlines deps so Node can run it without ESM/CJS surprises.
  ssr: { noExternal: true },
})
